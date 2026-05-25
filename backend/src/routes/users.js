const express = require("express");
const bcrypt = require("bcryptjs");
const { getUsers, saveUsers } = require("../db");
const { requireAdmin, requireAdminOrOwner } = require("../middleware/roles");
const { isValidPassword } = require("../utils/validate");

const router = express.Router();

router.get("/", requireAdmin, (req, res) => {
  const users = getUsers().map(({ password, ...u }) => u);
  res.json(users);
});

router.get("/me", (req, res) => {
  const users = getUsers();
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }
  const { password, ...userNoPass } = user;
  res.json(userNoPass);
});

router.get("/:id", requireAdminOrOwner, (req, res) => {
  const users = getUsers();
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }
  const { password, ...userNoPass } = user;
  res.json(userNoPass);
});

router.put("/:id", requireAdminOrOwner, async (req, res, next) => {
  try {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const allowed = ["name", "age", "password"];
    for (const key of Object.keys(req.body)) {
      if (!allowed.includes(key)) delete req.body[key];
    }

    if (req.body.password) {
      if (!isValidPassword(req.body.password)) {
        return res
          .status(400)
          .json({ message: "A senha deve ter no mínimo 6 caracteres" });
      }
      users[idx].password = await bcrypt.hash(req.body.password, 10);
    }
    if (req.body.name) users[idx].name = String(req.body.name).trim();
    if (req.body.age !== undefined) users[idx].age = req.body.age;

    saveUsers(users);
    const { password, ...userNoPass } = users[idx];
    res.json(userNoPass);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAdminOrOwner, (req, res) => {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }
  const deleted = users.splice(idx, 1)[0];
  saveUsers(users);
  const { password, ...userNoPass } = deleted;
  res.json({ message: "Usuário deletado", user: userNoPass });
});

router.patch("/:id/role", requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!role || (role !== "user" && role !== "admin")) {
    return res.status(400).json({ message: 'role deve ser "user" ou "admin"' });
  }
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }
  users[idx].role = role;
  saveUsers(users);
  const { password, ...userNoPass } = users[idx];
  res.json(userNoPass);
});

module.exports = router;
