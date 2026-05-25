const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { getUsers, saveUsers } = require("../db");
const { jwtSecret, jwtExpiresIn } = require("../config");
const { isValidEmail, isValidPassword } = require("../utils/validate");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, age } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email e password são obrigatórios" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email inválido" });
    }

    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ message: "A senha deve ter no mínimo 6 caracteres" });
    }

    const users = getUsers();
    const exists = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (exists) {
      return res.status(409).json({ message: "Email já cadastrado" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name: String(name).trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      age: age ?? null,
      role: "user",
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...userNoPass } = newUser;
    res.status(201).json(userNoPass);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const debugAuth = process.env.AUTH_DEBUG === "true";

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email e password são obrigatórios" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (debugAuth) {
      console.log("[auth/login] email:", normalizedEmail, "userFound:", Boolean(user));
    }

    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    if (!user.password || !user.password.startsWith("$2")) {
      console.error("[auth/login] hash inválido para usuário:", user.id);
      return res.status(500).json({ message: "Conta com dados inválidos. Contate o suporte." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (debugAuth) {
      console.log("[auth/login] bcrypt.compare:", match, "role:", user.role);
    }

    if (!match) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    const { password: _, ...userNoPass } = user;
    res.json({ token, user: userNoPass });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
