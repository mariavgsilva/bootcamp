require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// ==========================================
// CONFIGURAÇÃO DO SUPABASE (Ignorando o bug do terminal)
// ==========================================
const SUPABASE_URL = "https://eyqkzswyvxkmvujbpssg.supabase.co";
// IMPORTANTE: Cole sua chave gigante começando com eyJhbGci aqui
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cWt6c3d5dnhrbXZ1amJwc3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzUxNzcsImV4cCI6MjA5NTMxMTE3N30.37hPMviih8219ARRbJ-925gKjnyfTaRwi3S1lGFBdLY"; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// ==========================================

function requireJwtSecret() {
  // Adicionamos um fallback ("segredo_vitta_123") caso o terminal apague a variável
  const secret = process.env.JWT_SECRET || "segredo_vitta_123";
  if (!secret || !String(secret).trim()) {
    console.error("ERRO: JWT_SECRET não definido.");
    process.exit(1);
  }
  return secret;
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: requireJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  supabase, // Exportando o supabase para os outros arquivos usarem!
};