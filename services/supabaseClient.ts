import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Pega as variáveis de ambiente do Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se o Supabase está configurado
export const isSupabaseConfigured =
  SUPABASE_URL && SUPABASE_URL.length > 0 &&
  SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 0;

// Inicializa o cliente Supabase
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (isSupabaseConfigured && supabase) {
  console.log("✅ Supabase conectado com sucesso (modo real).");
} else {
  console.warn("⚠️ Supabase não configurado. Rodando em modo de demonstração.");
}
