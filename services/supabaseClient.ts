import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Declaração para o TypeScript entender o "import.meta.env"
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// --- CONFIGURAÇÃO SUPABASE ---
// As chaves podem vir das variáveis da Vercel (recomendado)
// ou diretamente do fallback abaixo (modo manual)

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_URL) ||
  'https://pzjxgemaaevdwiyrhvcc.supabase.co'

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6anhnZW1hYWV2ZHdpeXJodmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Nzc4MDksImV4cCI6MjA3NzI1MzgwOX0.a0EGvih3zx_CdoeBk2DJntP86k9qVJi-u73kjZzbiSc'

// Verifica se as chaves existem
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
