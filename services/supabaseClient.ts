import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Usa variáveis de ambiente definidas na Vercel (.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Verifica se as variáveis foram configuradas corretamente
export const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

// Cria o cliente apenas se houver credenciais válidas
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (isSupabaseConfigured && supabase) {
  console.log("✅ Conectado ao Supabase com sucesso. Modo REAL ativado.");
} else {
  console.warn("⚠️ Supabase não configurado. Rodando em modo DEMONSTRAÇÃO.");
}
