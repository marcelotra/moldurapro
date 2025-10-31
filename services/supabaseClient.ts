import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lê variáveis do ambiente (.env da Vercel)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Verifica se as variáveis existem
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Cria o cliente do Supabase (ou null se estiver em modo demo)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

if (isSupabaseConfigured && supabase) {
  console.log('✅ Supabase conectado com sucesso!')
} else {
  console.warn('⚠️ Rodando em modo de demonstração — as variáveis não foram encontradas.')
}
