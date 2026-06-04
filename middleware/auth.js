import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ZoumaGiftShopSecretKey_2026";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided or wrong format." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token or expired session." });
  }
}
