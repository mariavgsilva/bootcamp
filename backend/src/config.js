require("dotenv").config();

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || !String(secret).trim()) {
    console.error(
      "ERRO: JWT_SECRET não definido. Copie backend/.env.example para backend/.env e defina um valor seguro.",
    );
    process.exit(1);
  }
  return secret;
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: requireJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
