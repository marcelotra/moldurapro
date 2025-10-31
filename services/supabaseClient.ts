import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONECTA AO BANCO REAL (VIA VARIÁVEIS DE AMBIENTE) ---
// As variáveis são lidas automaticamente da Vercel (.env configurado lá)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis estão configuradas
export const isSupabaseConfigured =
  !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

// Inicializa o cliente Supabase
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (isSupabaseConfigured && supabase) {
  console.log("✅ Conectado ao Supabase com sucesso!");
} else {
  console.warn("⚠️ Rodando em modo de demonstração: as variáveis não foram encontradas.");
}
