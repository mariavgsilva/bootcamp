const express = require("express");
const bcrypt = require("bcryptjs");
const { supabase } = require("../config"); // Trazendo a conexão com a nuvem
const { requireAdmin, requireAdminOrOwner } = require("../middleware/roles");
const { isValidPassword } = require("../utils/validate");

const router = express.Router();

// Busca todos os usuários (Apenas Admin)
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, age, role, created_at"); // Pegamos tudo, menos a senha
    
    if (error) throw error;
    res.json(users || []);
  } catch (err) {
    next(err);
  }
});

// Busca o usuário logado
router.get("/me", async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, age, role, created_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Busca um usuário específico por ID
router.get("/:id", requireAdminOrOwner, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, age, role, created_at")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Atualiza os dados do usuário
router.put("/:id", requireAdminOrOwner, async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = String(req.body.name).trim();
    if (req.body.age !== undefined) updates.age = req.body.age;

    if (req.body.password) {
      if (!isValidPassword(req.body.password)) {
        return res.status(400).json({ message: "A senha deve ter no mínimo 6 caracteres" });
      }
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nenhum dado válido para atualizar" });
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.params.id)
      .select("id, name, email, age, role, created_at")
      .single();

    if (error) throw error;
    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// Deleta um usuário
router.delete("/:id", requireAdminOrOwner, async (req, res, next) => {
  try {
    const { data: deletedUser, error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id)
      .select("id, name, email, age, role, created_at")
      .maybeSingle();

    if (error) throw error;
    if (!deletedUser) return res.status(404).json({ message: "Usuário não encontrado" });

    res.json({ message: "Usuário deletado", user: deletedUser });
  } catch (err) {
    next(err);
  }
});

// Altera o cargo (role) do usuário
router.patch("/:id/role", requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || (role !== "user" && role !== "admin")) {
      return res.status(400).json({ message: 'role deve ser "user" ou "admin"' });
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", req.params.id)
      .select("id, name, email, age, role, created_at")
      .maybeSingle();

    if (error) throw error;
    if (!updatedUser) return res.status(404).json({ message: "Usuário não encontrado" });

    res.json(updatedUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;