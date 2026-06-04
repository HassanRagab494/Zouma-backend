import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { permissionMiddleware } from "../middleware/permission.js";
import { db } from "../db/supabase.js";

const router = Router();

// Secure with authentication and product domain permissions
router.use(authMiddleware);
router.use(permissionMiddleware("products"));

// GET /api/products
// Retrieve all products sorted by serial
router.get("/", async (req, res) => {
  try {
    const products = await db.products.list();
    return res.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

// POST /api/products
// Insert a new product item
router.post("/", async (req, res) => {
  const { name, wholesale_price, selling_price, stock } = req.body;

  if (!name) {
    return res.status(400).json({ error: "اسم المنتج حقل مطلوب" });
  }

  try {
    const created = await db.products.create({
      name,
      wholesale_price: Number(wholesale_price) || 0,
      selling_price: Number(selling_price) || 0,
      stock: Number(stock) || 0
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("POST /api/products error:", error);
    return res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT /api/products/:id
// Edit current product specifications
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, wholesale_price, selling_price, stock } = req.body;

  if (!name) {
    return res.status(400).json({ error: "اسم المنتج حقل مطلوب" });
  }

  try {
    const product = await db.products.get(id);
    if (!product) {
      return res.status(404).json({ error: "المنتج غير موجود" });
    }

    const updated = await db.products.update(id, {
      name,
      wholesale_price: Number(wholesale_price) || 0,
      selling_price: Number(selling_price) || 0,
      stock: Number(stock) || 0
    });

    return res.json(updated);
  } catch (error) {
    console.error(`PUT /api/products/${id} error:`, error);
    return res.status(500).json({ error: "Failed to update product details" });
  }
});

// DELETE /api/products/:id
// Delete product from catalog
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await db.products.get(id);
    if (!product) {
      return res.status(404).json({ error: "المنتج غير موجود" });
    }

    const deleted = await db.products.delete(id);
    return res.json({ message: "تم حذف المنتج بنجاح", product: deleted });
  } catch (error) {
    console.error(`DELETE /api/products/${id} error:`, error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
