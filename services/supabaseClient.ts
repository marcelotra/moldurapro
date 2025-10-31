/// <reference types="vite/client" />
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lê variáveis do ambiente da Vercel (.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se está configurado corretamente
export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

// Cria o cliente Supabase apenas se houver configuração
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (isSupabaseConfigured && supabase) {
  console.log("✅ Supabase conectado com sucesso!");
} else {
  console.warn("⚠️ Supabase não configurado — modo de demonstração ativo.");
}
