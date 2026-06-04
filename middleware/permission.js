export function permissionMiddleware(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized access: User not authenticated" });
    }

    const { role, permissions } = req.user;

    // Super Admin has full bypass permissions
    if (role === "super_admin") {
      return next();
    }

    // Check if user has required permission in their permissions array
    if (permissions && permissions.includes(requiredPermission)) {
      return next();
    }

    // Access Denied
    return res.status(403).json({ 
      error: `Forbidden: You do not have the required permission: '${requiredPermission}'` 
    });
  };
}
