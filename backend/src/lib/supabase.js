const { createClient } = require("@supabase/supabase-js");

function createSupabaseClient(userToken = null) {
  const options = {};
  
  // Se o usuário estiver logado no Express, repassamos o token dele para o Supabase validar o RLS
  if (userToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    };
  }

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    options
  );
}

module.exports = { createSupabaseClient };