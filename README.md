# Hotel Supply Pro

Piattaforma B2B per approvvigionamento F&B alberghiero. Catalogo prodotti, assistente AI, gestione ordini e pannello admin.

**Live:** [gabbo2105.github.io/Hotelsupply](https://gabbo2105.github.io/Hotelsupply/)

## Stack

- **Frontend:** Next.js 16 + Tailwind v4 + shadcn/ui
- **Backend:** Supabase (PostgreSQL 17, Auth, Edge Functions, pgvector)
- **AI:** Edge Function con GPT-4o-mini (tool calling, streaming SSE)
- **Deploy:** GitHub Pages (static export)

## Struttura

```
src/                      Next.js App Router (frontend)
supabase/migrations/      18 migration SQL
supabase/functions/       Edge Functions Deno/TS
scripts/                  Script utility Python
docs/                     Documentazione e ADR
tests/                    Test Deno
```

## Setup locale

```bash
cp .env.local.example .env.local   # inserisci le chiavi Supabase
npm install
npm run dev
```

## Deploy

Push su `main` triggera il workflow GitHub Actions che builda e deploya su GitHub Pages.
