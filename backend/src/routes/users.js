const express = require("express");
const bcrypt = require("bcryptjs");
const { getUsers, saveUsers } = require("../db");
// NOTA: Certifique-se de importar o seu middleware de autenticação (ex: requireAuth ou verifiyToken) 
// para a rota /me funcionar. Vou assumir que requireAdminOrOwner já faz essa validação ou que você tem um genérico.
const { requireAdmin, requireAdminOrOwner } = require("../middleware/roles");
const { isValidPassword } = require("../utils/validate");

const router = express.Router();

// Helper rápido para garantir que sempre tratamos um array limpo
function assegurarArray(dados) {
  return Array.isArray(dados) ? dados : (dados && Array.isArray(dados.data) ? dados.data : []);
}

// 1. LISTAR USUÁRIOS (Apenas Admin)
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const rawUsers = await getUsers();
    const users = assegurarArray(rawUsers).map(({ password, ...u }) => u);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// 2. MEU PERFIL (Qualquer usuário autenticado)
// ADICIONADO: requireAdminOrOwner (ou use o seu middleware de autenticação padrão aqui)
router.get("/me", requireAdminOrOwner, async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Não autorizado: ID do usuário ausente" });
    }
    
    const rawUsers = await getUsers();
    const users = assegurarArray(rawUsers);
    const user = users.find((u) => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    const { password, ...userNoPass } = user;
    res.json(userNoPass);
  } catch (err) {
    next(err);
  }
});

// 3. BUSCAR POR ID (Admin ou o Próprio Dono)
router.get("/:id", requireAdminOrOwner, async (req, res, next) => {
  try {
    const rawUsers = await getUsers();
    const users = assegurarArray(rawUsers);
    const user = users.find((u) => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    const { password, ...userNoPass } = user;
    res.json(userNoPass);
  } catch (err) {
    next(err);
  }
});

// 4. ATUALIZAR PERFIL (Admin ou o Próprio Dono)
router.put("/:id", requireAdminOrOwner, async (req, res, next) => {
  try {
    const rawUsers = await getUsers();
    const users = assegurarArray(rawUsers);
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

    await saveUsers(users);
    
    const { password, ...userNoPass } = users[idx];
    res.json(userNoPass);
  } catch (err) {
    next(err);
  }
});

// 5. DELETAR USUÁRIOS (Admin ou o Próprio Dono)
router.delete("/:id", requireAdminOrOwner, async (req, res, next) => {
  try {
    const rawUsers = await getUsers();
    const users = assegurarArray(rawUsers);
    const idx = users.findIndex((u) => u.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    const deleted = users.splice(idx, 1)[0];
    await saveUsers(users);
    
    const { password, ...userNoPass } = deleted;
    res.json({ message: "Usuário deletado", user: userNoPass });
  } catch (err) {
    next(err);
  }
});

// 6. ALTERAR PERMISSÃO / CARGO (Apenas Admin)
router.patch("/:id/role", requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || (role !== "user" && role !== "admin")) {
      return res.status(400).json({ message: 'role deve ser "user" ou "admin"' });
    }
    
    const rawUsers = await getUsers();
    const users = assegurarArray(rawUsers);
    const idx = users.findIndex((u) => u.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    
    users[idx].role = role;
    await saveUsers(users);
    
    const { password, ...userNoPass } = users[idx];
    res.json(userNoPass);
  } catch (err) {
    next(err);
  }
});

module.exports = router;