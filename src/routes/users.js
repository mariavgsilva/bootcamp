const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { getUsers, saveUsers } = require("../db");
const { requireAdmin, requireAdminOrOwner } = require("../middleware/roles");
// lista todos (admin)
router.get("/", requireAdmin, (req, res) => {
  const users = getUsers().map(({ password, ...u }) => u);
  res.json(users);
});
// pega perfil do próprio token
router.get("/me", (req, res) => {
  const users = getUsers();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
  const { password, ...userNoPass } = user;
  res.json(userNoPass);
});
// pega por id (admin ou owner)
router.get("/:id", requireAdminOrOwner, (req, res) => {
  const users = getUsers();
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
  const { password, ...userNoPass } = user;
  res.json(userNoPass);
});
// atualiza usuário (admin ou owner)
router.put("/:id", requireAdminOrOwner, async (req, res) => {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1)
    return res.status(404).json({ message: "Usuário não encontrado" });

  ;

  const allowed = ["name", "age", "password"];
  for (const key of Object.keys(req.body)) {
    if (!allowed.includes(key)) delete req.body[key];
  }
  if (req.body.password) {
    users[idx].password = await bcrypt.hash(req.body.password, 10);
  }
  if (req.body.name) users[idx].name = req.body.name;
  if (req.body.age !== undefined) users[idx].age = req.body.age;
  saveUsers(users);
  const { password, ...userNoPass } = users[idx];
  res.json(userNoPass);
});
// deletar usuário (admin ou owner)
router.delete("/:id", requireAdminOrOwner, (req, res) => {
  let users = getUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1)
    return res.status(404).json({ message: "Usuário não encontrado" });
  const deleted = users.splice(idx, 1)[0];
  saveUsers(users);
  const { password, ...userNoPass } = deleted;
  res.json({ message: "Usuário deletado", user: userNoPass });
});
// promover/demover role (apenas admin)
router.patch("/:id/role", requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!role || (role !== "user" && role !== "admin")) {
    return res.status(400).json({ message: 'role deve ser "user" ou "admin"' });
  }
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1)
    return res.status(404).json({ message: "Usuário não encontrado" });
  users[idx].role = role;
  saveUsers(users);
  const { password, ...userNoPass } = users[idx];
  res.json(userNoPass);
});
module.exports = router;
