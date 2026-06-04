import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/supabase.js";

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    const clientsList = await db.clients.list();
    const ordersList = await db.orders.list();

    const activeOrders = ordersList.filter(o => o.status !== "CANCELLED");

    let totalRevenue = 0;
    let totalCollected = 0;

    for (const order of activeOrders) {
      totalRevenue += Number(order.total) || 0;
      totalCollected += Number(order.paid_amount) || 0;
    }

    const totalDebts = Math.max(0, totalRevenue - totalCollected);
    const totalClientsCount = clientsList.length;
    const totalOrdersCount = activeOrders.length;

    // Sales per month for CURRENT year only
    const currentYear = new Date().getFullYear();
    const salesPerMonth = Array(12).fill(0);

    for (const order of activeOrders) {
      if (!order.date) continue;
      const orderDate = new Date(order.date);
      if (orderDate.getFullYear() === currentYear) {
        const monthNum = orderDate.getMonth();
        if (monthNum >= 0 && monthNum < 12) {
          salesPerMonth[monthNum] += Number(order.total) || 0;
        }
      }
    }

    // Top 5 Clients by spending
    const clientSpendingsMap = {};

    for (const client of clientsList) {
      clientSpendingsMap[client.id] = {
        id: client.id,
        name: client.name,
        code: client.client_code,
        spendings: 0,
        ordersCount: 0
      };
    }

    for (const order of activeOrders) {
      const cid = order.client_id;
      if (clientSpendingsMap[cid]) {
        clientSpendingsMap[cid].spendings += Number(order.total) || 0;
        clientSpendingsMap[cid].ordersCount += 1;
      } else {
        clientSpendingsMap[cid] = {
          id: cid,
          name: order.client_name || "عميل غير معروف",
          code: order.client_code || "",
          spendings: Number(order.total) || 0,
          ordersCount: 1
        };
      }
    }

    const topClients = Object.values(clientSpendingsMap)
      .sort((a, b) => b.spendings - a.spendings)
      .slice(0, 5);

    return res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalCollected: Number(totalCollected.toFixed(2)),
      totalDebts: Number(totalDebts.toFixed(2)),
      totalClients: totalClientsCount,
      totalOrders: totalOrdersCount,
      salesPerMonth: salesPerMonth.map(val => Number(val.toFixed(2))),
      topClients
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return res.status(500).json({ error: "Failed to generate dashboard statistics reports" });
  }
});

export default router;
