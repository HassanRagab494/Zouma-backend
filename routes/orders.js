import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { permissionMiddleware } from "../middleware/permission.js";
import { db } from "../db/supabase.js";

const router = Router();

// Secure with authentication and order domain rules
router.use(authMiddleware);
router.use(permissionMiddleware("orders"));

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const ordersList = await db.orders.list();
    return res.json(ordersList);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return res.status(500).json({ error: "Failed to retrieve orders" });
  }
});

// GET /api/orders/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const orderDetails = await db.orders.get(id);
    if (!orderDetails) {
      return res.status(404).json({ error: "الأوردر غير موجود" });
    }
    return res.json(orderDetails);
  } catch (error) {
    console.error(`GET /api/orders/${id} error:`, error);
    return res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// POST /api/orders
// Create a new order, calculate totals on backend, deduct products inventory stock automatically
router.post("/", async (req, res) => {
  const {
    client_id,
    status = "NEW",
    date,
    discount_percentage = 0,
    paid_amount = 0,
    notes = "",
    items = [] // array of { product_id, name, price, qty }
  } = req.body;

  if (!client_id || !date || !items || items.length === 0) {
    return res.status(400).json({ error: "بيانات الأوردر والمنتجات حقول مطلوبة" });
  }

  try {
    // 1. Calculate cost, base total, discount, total, and profit
    let baseTotal = 0;
    let cost = 0;

    const enrichedItems = [];
    for (const item of items) {
      let productWholesalePrice = 0;
      let productName = item.name;
      let productSellingPrice = Number(item.price);

      if (item.product_id) {
        const prod = await db.products.get(item.product_id);
        if (prod) {
          productWholesalePrice = Number(prod.wholesale_price) || 0;
          if (!productSellingPrice) {
            productSellingPrice = Number(prod.selling_price) || 0;
          }
          if (!productName) {
            productName = prod.name;
          }
        }
      }

      const itemQty = Number(item.qty) || 1;
      baseTotal += productSellingPrice * itemQty;
      cost += productWholesalePrice * itemQty;

      enrichedItems.push({
        product_id: item.product_id || null,
        name: productName,
        price: productSellingPrice,
        qty: itemQty,
        wholesale_price: productWholesalePrice
      });
    }

    const discountPercentageNumeric = Number(discount_percentage) || 0;
    const discount = (baseTotal * discountPercentageNumeric) / 100;
    const total = baseTotal - discount;
    const profit = total - cost;
    const paidAmountNumeric = Number(paid_amount) || 0;

    // 2. Setup order record
    const orderPayload = {
      client_id,
      status,
      date,
      discount_percentage: discountPercentageNumeric,
      paid_amount: paidAmountNumeric,
      total,
      cost,
      profit,
      discount,
      notes
    };

    const createdOrder = await db.orders.create(orderPayload, enrichedItems);

    return res.status(201).json({
      ...createdOrder,
      items: enrichedItems
    });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

// PUT /api/orders/:id
// Update an order (change status, values, notes, paid amount) and adjust stock accordingly
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    status,
    paid_amount,
    notes,
    discount_percentage,
    date,
    client_id
  } = req.body;

  try {
    const previousOrder = await db.orders.get(id);
    if (!previousOrder) {
      return res.status(404).json({ error: "الأوردر غير موجود" });
    }

    const previousStatus = previousOrder.status;

    // Use current values or fallback
    const finalClientId = client_id || previousOrder.client_id;
    const finalDate = date || previousOrder.date;
    const finalStatus = status || previousOrder.status;
    const finalNotes = notes !== undefined ? notes : previousOrder.notes;
    const finalPaidAmount = paid_amount !== undefined ? Number(paid_amount) : Number(previousOrder.paid_amount);
    const finalDiscountPercentage = discount_percentage !== undefined ? Number(discount_percentage) : Number(previousOrder.discount_percentage);

    // Recalculate financial fields based on discount percentage updates
    let updatedTotal = Number(previousOrder.total);
    let updatedDiscount = Number(previousOrder.discount);
    let updatedProfit = Number(previousOrder.profit);

    if (discount_percentage !== undefined) {
      const origCost = Number(previousOrder.cost);
      const originalBaseTotal = Number(previousOrder.total) + Number(previousOrder.discount);
      updatedDiscount = (originalBaseTotal * finalDiscountPercentage) / 100;
      updatedTotal = originalBaseTotal - updatedDiscount;
      updatedProfit = updatedTotal - origCost;
    }

    const updated = await db.orders.update(id, {
      client_id: finalClientId,
      status: finalStatus,
      date: finalDate,
      discount_percentage: finalDiscountPercentage,
      paid_amount: finalPaidAmount,
      total: updatedTotal,
      profit: updatedProfit,
      discount: updatedDiscount,
      notes: finalNotes
    });

    // Handle stock changes based on CANCELLED states
    if (previousStatus !== "CANCELLED" && finalStatus === "CANCELLED") {
      const orderItems = await db.orders.getOrderItems(id);
      for (const item of orderItems) {
        if (item.product_id) {
          await db.products.updateStock(item.product_id, item.qty);
        }
      }
    } else if (previousStatus === "CANCELLED" && finalStatus !== "CANCELLED") {
      const orderItems = await db.orders.getOrderItems(id);
      for (const item of orderItems) {
        if (item.product_id) {
          await db.products.updateStock(item.product_id, -item.qty);
        }
      }
    }

    return res.json(updated);
  } catch (error) {
    console.error(`PUT /api/orders/${id} error:`, error);
    return res.status(500).json({ error: "Failed to update order" });
  }
});

// PATCH /api/orders/:id/status
// Quick status change handler
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["NEW", "PREPARING", "READY", "DELIVERED", "CANCELLED"];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "حالة الطلب غير صالحة" });
  }

  try {
    const previousOrder = await db.orders.get(id);
    if (!previousOrder) {
      return res.status(404).json({ error: "الأوردر غير موجود" });
    }

    const previousStatus = previousOrder.status;

    const updated = await db.orders.update(id, { status });

    // Handle stock variations
    if (previousStatus !== "CANCELLED" && status === "CANCELLED") {
      const orderItems = await db.orders.getOrderItems(id);
      for (const item of orderItems) {
        if (item.product_id) {
          await db.products.updateStock(item.product_id, item.qty);
        }
      }
    } else if (previousStatus === "CANCELLED" && status !== "CANCELLED") {
      const orderItems = await db.orders.getOrderItems(id);
      for (const item of orderItems) {
        if (item.product_id) {
          await db.products.updateStock(item.product_id, -item.qty);
        }
      }
    }

    return res.json(updated);
  } catch (error) {
    console.error(`PATCH /api/orders/${id}/status error:`, error);
    return res.status(500).json({ error: "Failed to update order status" });
  }
});

// DELETE /api/orders/:id
// Remove order and return product stock if status was active
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await db.orders.get(id);
    if (!order) {
      return res.status(404).json({ error: "الأوردر غير موجود" });
    }

    // Return inventory stock if appropriate
    if (order.status !== "DELIVERED" && order.status !== "CANCELLED") {
      const itemsList = await db.orders.getOrderItems(id);
      for (const item of itemsList) {
        if (item.product_id) {
          await db.products.updateStock(item.product_id, item.qty);
        }
      }
    }

    const deleted = await db.orders.delete(id);
    return res.json({ message: "تم حذف الأوردر وإرجاع المخزون بنجاح", order: deleted });
  } catch (error) {
    console.error(`DELETE /api/orders/${id} error:`, error);
    return res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
