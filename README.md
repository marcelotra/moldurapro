# MolduraPro

Aplicativo web (React + Vite + TypeScript) conectado ao Supabase.

## Como publicar na Vercel

1. Crie uma conta em https://vercel.com
2. Clique em **Add New → Project** e faça upload desta pasta como um `.zip` ou importe do GitHub.
3. Em **Project Settings → Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` → URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` → chave pública (anon) do Supabase
4. Clique em **Deploy**.

A aplicação ficará acessível em uma URL do tipo:
```
https://moldurapro.vercel.app
```

## Scripts úteis

- `npm run dev` — rodar localmente (requer Node.js LTS)
- `npm run build` — gerar build de produção
- `npm run preview` — pré-visualizar o build

## Observações

- **NÃO** commit suas chaves no repositório. Use variáveis de ambiente.
- O banco de dados e a autenticação são providos pelo **Supabase**.
- Este pacote foi preparado para **deploy estático** (sem backend próprio).

