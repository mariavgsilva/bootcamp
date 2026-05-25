/**
 * Reseta a senha do admin em db.json (sistema ativo deste projeto).
 * Uso: node scripts/reset-admin-password.js [novaSenha]
 * Padrão: admin123
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { getUsers, saveUsers } = require("../src/db");

const ADMIN_EMAIL = "admin@example.com";
const newPassword = process.argv[2] || "admin123";

async function main() {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === ADMIN_EMAIL);

  if (idx === -1) {
    console.error(`Usuário ${ADMIN_EMAIL} não encontrado em db.json`);
    process.exit(1);
  }

  users[idx].password = await bcrypt.hash(newPassword, 10);
  users[idx].role = "admin";
  saveUsers(users);

  const ok = await bcrypt.compare(newPassword, users[idx].password);
  console.log(`Senha do admin atualizada. Verificação bcrypt: ${ok}`);
  console.log(`Login: ${ADMIN_EMAIL} / ${newPassword}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
