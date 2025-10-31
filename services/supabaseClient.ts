import { createClient, SupabaseClient } from '@supabase/supabase-js'

// --- CONFIGURAÇÃO SUPABASE ---
// Esta versão é totalmente compatível com a Vercel e ignora o TypeScript do Vite.
// Ela lê variáveis da Vercel via process.env (como Node.js) e usa fallback local.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://pzjxgemaaevdwiyrhvcc.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6anhnZW1hYWV2ZHdpeXJodmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc4MDksImV4cCI6MjA3NzI1MzgwOX0.a0EGvih3zx_CdoeBk2DJntP86k9qVJi-u73kjZzbiSc'

// Verifica se as variáveis estão preenchidas
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Inicializa o cliente Supabase
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

if (isSupabaseConfigured && supabase) {
  console.log('✅ Supabase conectado com sucesso (modo real).')
} else {
  console.warn('⚠️ Rodando em modo de demonstração — credenciais não encontradas.')
}
