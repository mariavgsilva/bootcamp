const bcrypt = require("bcryptjs");
const { getUsers } = require("../src/db");

const hash = getUsers().find((u) => u.email === "admin@example.com")?.password;

const candidates = [
  "admin123",
  "admin",
  "password",
  "123456",
  "Administrator",
  "admin@example.com",
  "vitta",
  "clinica",
  "minha_chave_super_secreta",
];

async function main() {
  console.log("Admin hash from db.json:", hash);
  for (const pwd of candidates) {
    const ok = await bcrypt.compare(pwd, hash);
    console.log(`${pwd}: ${ok}`);
  }
  const newHash = await bcrypt.hash("admin123", 10);
  console.log("\nNew hash for admin123:", newHash);
}

main();
