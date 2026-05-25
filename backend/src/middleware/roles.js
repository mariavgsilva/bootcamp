function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Não autorizado" });
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Acesso restrito a administradores" });
  }
  next();
}

function requireAdminOrOwner(req, res, next) {
  const { id: userIdFromToken, role } = req.user;
  const targetId = req.params.id;
  if (role === "admin" || userIdFromToken === targetId) {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Acesso restrito (admin ou dono do recurso)" });
}

module.exports = { requireAdmin, requireAdminOrOwner };
