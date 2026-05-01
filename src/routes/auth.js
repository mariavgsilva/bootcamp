const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { getUsers, saveUsers } = require("../db");
require("dotenv").config();

;

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
// Registro
router.post("/register", async (req, res) => {
  const { name, email, password, age } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "name, email e password são obrigatórios" });
  }
  const users = getUsers();
  const exists = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (exists) return res.status(409).json({ message: "Email já cadastrado" });
  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    name,
    email: email.toLowerCase(),
    password: hashed,
    age: age || null,
    role: "user",
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  // remove senha antes de enviar
  const { password: _, ...userNoPass } = newUser;
  res.status(201).json(userNoPass);
});
// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === (email || "").toLowerCase(),
  );
  if (!user) return res.status(401).json({ message: "Credenciais inválidas" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Credenciais inválidas" });
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  const { password: _, ...userNoPass } = user;

  ;

  res.json({ token, user: userNoPass });
});
module.exports = router;
