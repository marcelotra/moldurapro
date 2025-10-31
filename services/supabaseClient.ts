import { createClient, SupabaseClient } from '@supabase/supabase-js'

// --- CONECTE SEU BANCO DE DADOS AQUI ---
// Para sair do modo de demonstração e salvar seus dados permanentemente,
// substitua os valores abaixo pelas suas credenciais do Supabase.
// Você pode encontrá-las em seu painel do Supabase em: Settings > API.

// IMPORTANTE: Por segurança, NUNCA compartilhe ou envie este arquivo para um repositório
// (como o GitHub) com suas chaves preenchidas.

const SUPABASE_URL = "https://pzjxgemaaevdwiyrhvcc.supabase.co" // Exemplo: "https://abcdefg.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6anhnZW1hYWV2ZHdpeXJodmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc4MDksImV4cCI6MjA3NzI1MzgwOX0.a0EGvih3zx_CdoeBk2DJntP86k9qVJi-u73kjZzbiSc" // Exemplo: "ey..."

// -------------------------------------------------------------------

// A configuração é considerada válida se as chaves não forem os valores padrão.
export const isSupabaseConfigured =
  SUPABASE_URL !== "" &&
  SUPABASE_ANON_KEY !== ""

// Inicializa o cliente Supabase de forma condicional.
// Se as chaves não estiverem presentes, `supabase` será `null`, e o app usará o mock backend.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

if (isSupabaseConfigured && supabase) {
  console.log("✅ Cliente Supabase inicializado com sucesso. Rodando em modo real.")
} else {
  console.warn("⚠️ Credenciais do Supabase não encontradas. Rodando em modo de demonstração.")
}
