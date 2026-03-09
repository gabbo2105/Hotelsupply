# Hotel Supply Pro

Piattaforma B2B per approvvigionamento F&B alberghiero ("Amazon per hotel").
Stage: prototipo/demo. Obiettivo: demo convincente per investitori.
Fondatore singolo + Claude Code.

## Stack

- **Frontend**: Next.js 16 App Router + shadcn/ui + Tailwind v4, deploy GitHub Pages
- **Backend**: Supabase (PostgreSQL 17, Auth, Edge Functions Deno/TS, pgvector, RLS)
- **AI**: Edge Function `ai-chat` (GPT-4o-mini, streaming SSE, tool calling diretto)
- **Progetto Supabase**: `wvlqjpmphfhkctupwvvd` (eu-west-1)
- **Deploy**: GitHub Pages con `output: "export"`, basePath `/Hotelsupply`
- **URL locale**: `http://localhost:3000/Hotelsupply` (basePath si applica anche in dev)
- **URL produzione**: `https://<user>.github.io/Hotelsupply`

## Struttura Monorepo

```
src/                  → Next.js App Router (frontend)
supabase/migrations/  → 17 migration SQL (schema DB)
supabase/functions/   → Edge Functions Deno/TS (ai_chat, search, chat_proxy)
scripts/              → Script Python (import prodotti, embeddings)
docs/                 → Piano strategico, ADR, architettura
tests/                → Test Deno per Edge Functions
```

## Roadmap

- **Fase 0**: COMPLETATA — Fix sicurezza (XSS, RLS, prezzi server-side)
- **Fase 1**: COMPLETATA — Eliminare n8n, Edge Function ai-chat, ordini server-side
- **Fase 2**: COMPLETATA — Migrazione Next.js + catalogo sfogliabile
- **Fase 2.5**: Admin panel (dashboard, catalogo, ordini, utenti, analytics)
- **Fase 3**: Polish per demo investitori

## Asset Chiave

- `search_products_v2` RPC (FTS italiano + trigram GIN, no embeddings) — ricerca diretta istantanea
- `search_products_hybrid` RPC (FTS + pgvector semantic) — usato solo dall'AI agent per query concettuali
- Edge Function `ai-chat` v3 — GPT-4o-mini con 5 tools (search_products, search_products_semantic, read_cart, get_customer, send_email)
- Categorie rimosse (2026-03-06) — archivio in memory/categories-archive.md per rollback

## Convenzioni

- Lingua app: Italiano
- Valuta: EUR
- DB naming: snake_case
- Edge Functions: TypeScript strict, Deno runtime
- RLS: `(select auth.uid())` pattern (NON `auth.uid()` diretto)
- Admin role: `app_metadata.role = 'admin'` (ADR-003)
- Frontend: React hooks pattern, shadcn/ui components
