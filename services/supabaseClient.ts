import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lê variáveis do ambiente da Vercel (.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Verifica se está configurado corretamente
export const isSupabaseConfigured =
  !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

// Cria o cliente Supabase somente se as variáveis existirem
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (isSupabaseConfigured && supabase) {
  console.log("✅ Supabase conectado com sucesso — modo real ativado.");
} else {
  console.warn("⚠️ Supabase não configurado. Rodando em modo de demonstração.");
}
