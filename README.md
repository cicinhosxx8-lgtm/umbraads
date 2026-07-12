# UmbraAds

SaaS brasileiro de **espionagem de anúncios do Facebook Ads** (Meta Ad Library).
Público: afiliado, gestor de tráfego, dropshipper e infoprodutor BR.

> **Dados, não achismo.** Modele o que já vende — pare de queimar verba em criativo que não escala.

## Stack

- **Next.js 14** (App Router) + **TypeScript strict**
- **Tailwind CSS** (tokens da marca no `tailwind.config.ts`)
- **Supabase**: Postgres + Auth (`@supabase/ssr`) + RLS
- **Recharts** (gráficos) · **lucide-react** (ícones)
- Deploy alvo: **Vercel** (com Vercel Cron)

## Estrutura

```
app/                      # rotas (App Router)
  (app)/                  # route group protegido (sidebar + topbar + guard) — FASES 2-4
  api/                    # route handlers — FASES 3-5
  layout.tsx              # layout raiz (fonte Inter, globals)
  page.tsx                # "/" (placeholder; landing real na FASE 5)
  globals.css
components/                # AdCard, ScaleBadge, StatusDot, FiltersBar, Sidebar... — FASES 2-4
lib/
  supabase/               # clients: client.ts, server.ts, admin.ts, middleware.ts
  providers/              # camada de dados da RapidAPI — FASE 5
  types/database.ts       # tipos do banco
  utils.ts                # cn(), scaleFaixa(), etc.
middleware.ts             # renova sessão + guard das rotas protegidas
supabase/
  migrations/             # 0001_schema, 0002_rls, 0003_triggers
  seed.sql                # 10 páginas, 30 anúncios BR, 60 dias de snapshots
```

## Setup passo a passo

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o projeto no Supabase

1. Crie um projeto em <https://supabase.com>.
2. Em **Project Settings → API**, copie `URL`, `anon key` e `service_role key`.

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` com as chaves do passo 2. **Nunca** commite este arquivo
(já está no `.gitignore`). A `service_role` e a `RAPIDAPI_KEY` vivem **só** aqui
e no servidor.

> ⚠️ **Segurança:** a chave da RapidAPI que aparecia em
> `RAPIDAPI-INFORMAÇOES/scripts/test-api.ts` circulou em texto plano —
> **rotacione-a no RapidAPI** antes de usar.

### 4. Aplicar migrations e seed

**Opção A — SQL Editor do painel (mais simples):**
cole e rode, na ordem:
`supabase/migrations/0001_schema.sql` → `0002_rls.sql` → `0003_triggers.sql` →
por fim `supabase/seed.sql`.

**Opção B — Supabase CLI:**

```bash
npx supabase link --project-ref <SEU_PROJECT_REF>
npx supabase db push          # aplica as migrations
# roda o seed:
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

### 5. Rodar o app

```bash
npm run dev
```

Abra <http://localhost:3000>. O placeholder da home confirma que o scaffold subiu.
Verificação de tipos: `npm run typecheck`.

## Roadmap por fases

| Fase | Entrega |
|------|---------|
| **1 — Fundação** ✅ | Scaffold, Tailwind com tokens, clients Supabase, middleware, migrations + seed |
| 2 — Shell + Auth | `/login` com Supabase Auth (email/senha + Google), sidebar/topbar, guard |
| 3 — Telas core | `/ofertas` (feed + filtros), `/ofertas/[id]` (gráfico), `/dashboard` |
| 4 — Retenção | `/monitorando`, `/rastreados` (tabs, alertas), botões Monitorar/Rastrear |
| 5 — Motor | Providers + key-manager + busca com cache + crons + webhook + `/ajustes` + landing |

## Segurança (não negociável)

- `SUPABASE_SERVICE_ROLE_KEY` e `RAPIDAPI_KEY` **só** no servidor (API routes / env).
  O client `lib/supabase/admin.ts` importa `server-only` — o build quebra se
  alguém tentar usá-lo no browser.
- `api_keys` e `query_cache` têm **RLS sem policy**: nenhum client acessa, só a
  service role.
- `.env.local` nunca é commitado.
