import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/supabase.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "ZoumaGiftShopSecretKey_2026";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" });
  }

  try {
    // Find user by email
    const user = await db.users.getByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    // Verify password hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    // Sign JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return authenticated payload
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || []
      }
    });
  } catch (error) {
    console.error("Login router error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول، الرجاء المحاولة لاحقاً" });
  }
});

export default router;
