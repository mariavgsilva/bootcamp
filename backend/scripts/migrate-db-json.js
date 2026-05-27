require('dotenv').config(); // Garanta que isso está na linha 1

console.log("=== DIAGNÓSTICO DE CREDENCIAIS ===");
console.log("URL lida pelo Node:", process.env.SUPABASE_URL);
console.log("Chave lida pelo Node (Começo):", process.env.SUPABASE_ANON_KEY?.substring(0, 15) + "...");
console.log("==================================");


require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// ATENÇÃO: COLOQUE A CHAVE SERVICE_ROLE DIRETO AQUI APENAS PARA RODAR O SCRIPT
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cWt6c3d5dnhrbXZ1amJwc3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzUxNzcsImV4cCI6MjA5NTMxMTE3N30.37hPMviih8219ARRbJ-925gKjnyfTaRwi3S1lGFBdLY"; 

const supabase = createClient(
  process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const dbPath = path.join(__dirname, "../db.json");
  if (!fs.existsSync(dbPath)) {
    console.log("Arquivo db.json não encontrado.");
    return;
  }
  
  const { users, appointments } = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  console.log(`Migrando ${users.length} usuários...`);

  for (const u of users) {
    const { error } = await supabase.from("users").upsert({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      age: u.age ?? null,
      role: u.role || "user",
    });
    if (error) console.error("❌ Erro usuário:", u.email, error.message);
    else console.log("✅ Usuário migrado:", u.email);
  }
  console.log("\nMigração concluída.");




}

main().catch(console.error);