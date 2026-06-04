import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { permissionMiddleware } from "../middleware/permission.js";
import { db } from "../db/supabase.js";

const router = Router();

// Secure client operations with authentication and specific client permission policies
router.use(authMiddleware);
router.use(permissionMiddleware("clients"));

// GET /api/clients
// Read all clients sorted by created_at desc
router.get("/", async (req, res) => {
  try {
    const clients = await db.clients.list();
    return res.json(clients);
  } catch (error) {
    console.error("GET /api/clients error:", error);
    return res.status(500).json({ error: "Failed to retrieve clients list" });
  }
});

// GET /api/clients/:id
// Read a client along with their historic order logs list
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const client = await db.clients.get(id);
    if (!client) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }

    // Load orders associated with the client
    const allOrders = await db.orders.list();
    const clientOrders = allOrders.filter(o => o.client_id === id);

    return res.json({
      ...client,
      orders: clientOrders
    });
  } catch (error) {
    console.error(`GET /api/clients/${id} error:`, error);
    return res.status(500).json({ error: "Failed to fetch client profile" });
  }
});

// POST /api/clients
// Add a client profile with automated unique Client Code generation
router.post("/", async (req, res) => {
  const { name, phone, phone2, address, dob } = req.body;

  if (!name) {
    return res.status(400).json({ error: "اسم العميل حقل مطلوب" });
  }

  try {
    let client_code = "";
    let attempts = 0;
    while (attempts < 10) {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      const existing = await db.clients.getByCode(code);
      if (!existing) {
        client_code = code;
        break;
      }
      attempts++;
    }

    if (!client_code) {
      client_code = Math.floor(1000 + Math.random() * 9000).toString();
    }

    const created = await db.clients.create({
      name,
      phone: phone || null,
      phone2: phone2 || null,
      address: address || null,
      client_code,
      dob: dob || null
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error("POST /api/clients error:", error);
    return res.status(500).json({ error: "Failed to create client" });
  }
});

// PUT /api/clients/:id
// Update current profiles metadata
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, phone2, address, dob } = req.body;

  if (!name) {
    return res.status(400).json({ error: "اسم العميل حقل مطلوب" });
  }

  try {
    const client = await db.clients.get(id);
    if (!client) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }

    const updated = await db.clients.update(id, {
      name,
      phone: phone || null,
      phone2: phone2 || null,
      address: address || null,
      dob: dob || null
    });

    return res.json(updated);
  } catch (error) {
    console.error(`PUT /api/clients/${id} error:`, error);
    return res.status(500).json({ error: "Failed to update client info" });
  }
});

// DELETE /api/clients/:id
// Completely erase client along with database cascading
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const client = await db.clients.get(id);
    if (!client) {
      return res.status(404).json({ error: "العميل غير موجود" });
    }

    const deleted = await db.clients.delete(id);
    return res.json({ message: "تم حذف العميل وكل أوردراته بنجاح", client: deleted });
  } catch (error) {
    console.error(`DELETE /api/clients/${id} error:`, error);
    return res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
