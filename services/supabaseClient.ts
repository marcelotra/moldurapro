import { createClient } from '@supabase/supabase-js'

// 🔗 Lê as variáveis de ambiente do Vercel (prefixadas com VITE_)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// 🔒 Verifica se estão válidas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("⚠️ Supabase não configurado. Rodando em modo de demonstração.")
}

// 🔧 Cria o cliente Supabase real
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null
