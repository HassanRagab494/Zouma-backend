import { Router } from "express";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../db/supabase.js";

const router = Router();

router.use(authMiddleware);

// Middleware to restrict access to super administrators only
function restrictToSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden: هذا الإجراء مخصص للمدراء المسؤولين فقط" });
  }
  next();
}

router.use(restrictToSuperAdmin);

// GET /api/users
// Retrieve all employee profiles
router.get("/", async (req, res) => {
  try {
    const list = await db.users.list();
    return res.json(list);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return res.status(500).json({ error: "Failed to fetch users list" });
  }
});

// POST /api/users
// Register a new employee account with bcrypt hashing
router.post("/", async (req, res) => {
  const { name, email, password, role = "employee", permissions = [] } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "الرجاء توفير الاسم، البريد الإلكتروني وكلمة المرور" });
  }

  try {
    const duplicate = await db.users.getByEmail(email);
    if (duplicate) {
      return res.status(400).json({ error: "البريد الإلكتروني مسجل بالفعل لمستخدم آخر" });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const created = await db.users.create({
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      role,
      permissions
    });

    const { password_hash: _, ...userNoHash } = created;
    return res.status(201).json(userNoHash);
  } catch (error) {
    console.error("POST /api/users error:", error);
    return res.status(500).json({ error: "Failed to create user account" });
  }
});

// PUT /api/users/:id
// Edit existing attributes or password
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, permissions } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "الاسم والبريد الإلكتروني حقول مطلوبة" });
  }

  try {
    const user = await db.users.get(id);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    if (email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      const duplicate = await db.users.getByEmail(email);
      if (duplicate) {
        return res.status(400).json({ error: "البريد الإلكتروني مسجل بالفعل لمستخدم آخر" });
      }
    }

    if (id === req.user?.id && role && role !== user.role) {
      return res.status(400).json({ error: "لا يمكنك تغيير رتبة حسابك الشخصي لموظف" });
    }

    let finalHash = user.password_hash;
    if (password && password.trim() !== "") {
      const saltRounds = 10;
      finalHash = await bcrypt.hash(password, saltRounds);
    }

    const finalRole = role || user.role;
    const finalPermissions = permissions || user.permissions || [];

    const updated = await db.users.update(id, {
      name,
      email: email.toLowerCase().trim(),
      password_hash: finalHash,
      role: finalRole,
      permissions: finalPermissions
    });

    const { password_hash: _, ...userNoHash } = updated;
    return res.json(userNoHash);
  } catch (error) {
    console.error(`PUT /api/users/${id} error:`, error);
    return res.status(500).json({ error: "Failed to update employee details" });
  }
});

// DELETE /api/users/:id
// Terminate an employee account, preventing self-deletion
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (id === req.user?.id) {
      return res.status(400).json({ error: "لا يمكنك حذف حسابك الشخصي النشط حالياً" });
    }

    const user = await db.users.get(id);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    const deleted = await db.users.delete(id);
    const { password_hash: _, ...deletedNoHash } = deleted;
    return res.json({ message: "تم حذف حساب المستخدم بنجاح", user: deletedNoHash });
  } catch (error) {
    console.error(`DELETE /api/users/${id} error:`, error);
    return res.status(500).json({ error: "Failed to delete user account" });
  }
});

export default router;
