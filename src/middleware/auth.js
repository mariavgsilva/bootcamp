const jwt = require("jsonwebtoken");
const { getUsers } = require("../db");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach user info (id and role) to request
    req.user = payload;

    ;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}
module.exports = authMiddleware;
