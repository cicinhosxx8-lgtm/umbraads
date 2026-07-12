# UmbraAds — Plano Completo de Desenvolvimento

> Plataforma de espionagem de anúncios do Facebook Ads (Meta Ad Library), focada no mercado brasileiro. Parte do ecossistema Umbra.

---

## 1. Visão Geral

**Produto:** UmbraAds — inteligência de anúncios do Facebook/Instagram. O usuário descobre ofertas escaladas, monitora anúncios em verificação contínua e recebe alertas quando páginas rastreadas sobem criativos novos.

**Posicionamento:** "Veja o que está escalando no Facebook Ads AGORA — em português, com preço brasileiro." Concorrentes (AdSpy, BigSpy, Minea) cobram US$99–249/mês. O UmbraAds entra em BRL com foco no mercado BR.

**Público:** afiliados, dropshippers, gestores de tráfego, produtores de infoproduto.

**Métrica de ouro do produto:** o "Scale Score" — pontuação proprietária que combina número de variações ativas, crescimento de variações nos últimos 7 dias e tempo de veiculação. Anúncio rodando há 30+ dias com variações crescendo = oferta lucrativa.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript |
| Estilo | Tailwind CSS (paleta Umbra abaixo) |
| Backend / DB | Supabase (Postgres + Auth + Edge Functions + pg_cron) |
| Deploy | Vercel (frontend + API routes + Vercel Cron) |
| Versionamento | GitHub (repo privado, deploy automático via Vercel) |
| Dados | RapidAPI — múltiplas APIs da Meta Ad Library com rotação de 15+ chaves |
| Pagamento | Kiwify ou Cakto (webhook → Supabase) |

---

## 3. Design System (Paleta Umbra)

### Base / Fundos e textos — zinc
| Tom | Hex | Uso |
|---|---|---|
| zinc-950 | #09090b | Fundo principal do app |
| zinc-900 | #18181b | Cards, painéis |
| zinc-800 | #27272a | Bordas, divisores |
| zinc-700 | #3f3f46 | Hover de bordas |
| zinc-600 | #52525b | Texto bem apagado |
| zinc-500 | #71717a | Labels, texto secundário |
| zinc-400 | #a1a1aa | Texto de apoio |
| zinc-300 | #d4d4d8 | Texto de corpo claro |
| zinc-200 | #e4e4e7 | Texto quase branco |
| zinc-100 | #f4f4f5 | Texto branco suave |

### Marca — amber
| Tom | Hex | Uso |
|---|---|---|
| amber-500 | #f59e0b | Primária (botões, ícones, acentos, Scale Score) |
| amber-400 | #fbbf24 | Hover / brilho |
| amber-300 | #fcd34d | Realce pontual |

### Semânticas
| Cor | Hex | Uso no UmbraAds |
|---|---|---|
| emerald-500/400 | #10b981 / #34d399 | Anúncio ATIVO, "copiado", crescimento positivo |
| red-500/400 | #ef4444 / #f87171 | Anúncio PAUSADO/morto, queda de variações, erros |
| violet-500/400 | #8b5cf6 / #a78bfa | Badges especiais (ex.: "Oferta Validada 30d+") |

**Regras de UI:**
- Fundo sempre zinc-950; cards zinc-900 com borda zinc-800 (hover zinc-700).
- amber-500 é reservado para ação primária e para o Scale Score — nunca banalizar.
- Status de anúncio: dot emerald (ativo) / dot red (morto).
- Tipografia: Inter. Números de métricas em `font-semibold tabular-nums`.

---

## 4. Camada de Dados — RapidAPI com rotação de 15+ chaves

### 4.1 Estratégia
Usar múltiplas APIs da Meta Ad Library disponíveis no RapidAPI (ex.: "Facebook Ad Library API", "Meta Ad Library Scraper" e similares — validar as 2–3 melhores no dia da build) atrás de um **adapter único**, para nunca ficar refém de um provedor.

Com 15+ chaves RapidAPI, implementar **key rotation** para multiplicar quota:

```
lib/providers/
  index.ts          → interface AdProvider (searchAds, getAd, getPageAds)
  provider-a.ts     → adapter da API principal
  provider-b.ts     → adapter da API reserva
  key-manager.ts    → rotação de chaves + contagem de uso
```

### 4.2 Key Manager (lógica)
1. Tabela `api_keys` guarda cada chave, provedor, limite mensal e uso atual.
2. A cada request, seleciona a chave com menor uso relativo (`uso / limite`).
3. Se a resposta vier 429 (rate limit), marca a chave como `cooldown` por 1h e tenta a próxima.
4. Reset de contadores no dia de renovação de cada chave.

### 4.3 Cache agressivo (regra de ouro do custo)
**Nenhuma busca do usuário bate direto na RapidAPI.** Fluxo:

1. Usuário busca → API route consulta a tabela `ads` no Supabase.
2. Se o cache da query tem menos de 12h → serve do banco (custo zero).
3. Se está velho ou não existe → busca na RapidAPI, normaliza, faz upsert no banco, serve.
4. Cron diário atualiza SÓ o que os usuários monitoram/rastreiam.

Resultado: ~90% menos chamadas de API e egress do Supabase controlado.

### 4.4 Scale Score (cálculo proprietário)
```
scale_score = (variacoes_ativas * 2)
            + (crescimento_variacoes_7d * 5)
            + min(dias_ativo, 60)
```
- Recalculado no cron diário.
- Faixas de exibição: 0–30 Fraco (zinc-500) · 31–70 Aquecendo (amber-400) · 71+ ESCALANDO (amber-500 + badge).

---

## 5. Banco de Dados (Supabase)

```sql
-- Perfis (espelho de auth.users)
profiles (
  id uuid pk references auth.users,
  email text,
  plano text default 'free',          -- free | basico | pro | elite
  plano_expira_em timestamptz,
  buscas_hoje int default 0,
  created_at timestamptz default now()
)

-- Anúncios (cache normalizado da Ad Library)
ads (
  id uuid pk default gen_random_uuid(),
  ad_archive_id text unique not null,  -- id da Meta Ad Library
  page_id text not null,
  page_name text,
  tipo_criativo text,                  -- video | imagem | carrossel
  copy_texto text,
  cta text,
  link_destino text,
  snapshot_url text,                   -- preview do criativo
  pais text default 'BR',
  nicho text,
  idioma text,
  ativo boolean default true,
  data_inicio date,
  dias_ativo int,
  variacoes_ativas int default 1,
  variacoes_7d_atras int,
  scale_score int default 0,
  primeiro_visto timestamptz default now(),
  ultima_verificacao timestamptz default now()
)
-- índices: (scale_score desc), (page_id), (nicho, pais), (ativo)

-- Páginas anunciantes
pages (
  page_id text pk,
  nome text,
  anuncios_ativos int default 0,
  primeiro_visto timestamptz default now(),
  ultima_verificacao timestamptz
)

-- Histórico diário p/ gráfico de escala
page_snapshots (
  id bigserial pk,
  page_id text references pages,
  data date,
  anuncios_ativos int,
  unique(page_id, data)
)

-- MONITORANDO: ofertas em verificação contínua
monitorados (
  id uuid pk default gen_random_uuid(),
  user_id uuid references profiles,
  ad_id uuid references ads,
  nota text,
  status text default 'observando',    -- observando | validada | morta
  criado_em timestamptz default now(),
  unique(user_id, ad_id)
)

-- RASTREADOS: páginas ou palavras-chave seguidas
rastreados (
  id uuid pk default gen_random_uuid(),
  user_id uuid references profiles,
  tipo text,                           -- 'pagina' | 'keyword'
  valor text,                          -- page_id ou termo
  ativo boolean default true,
  criado_em timestamptz default now()
)

-- ALERTAS gerados pelo cron
alertas (
  id uuid pk default gen_random_uuid(),
  user_id uuid references profiles,
  rastreado_id uuid references rastreados,
  tipo text,        -- 'novo_anuncio' | 'explosao_variacoes' | 'oferta_morta'
  titulo text,
  payload jsonb,
  lido boolean default false,
  criado_em timestamptz default now()
)

-- Rotação de chaves RapidAPI
api_keys (
  id uuid pk default gen_random_uuid(),
  provedor text,
  chave text,                          -- criptografada / só service role
  limite_mensal int,
  uso_atual int default 0,
  status text default 'ativa',         -- ativa | cooldown | esgotada
  cooldown_ate timestamptz,
  renova_em date
)

-- Log de queries p/ cache
query_cache (
  id uuid pk default gen_random_uuid(),
  query_hash text unique,              -- hash dos filtros da busca
  ad_ids uuid[],
  atualizado_em timestamptz default now()
)
```

**RLS:** `profiles`, `monitorados`, `rastreados`, `alertas` → usuário só vê o próprio (`auth.uid() = user_id`). `ads`, `pages`, `page_snapshots` → leitura para autenticados; escrita só via service role. `api_keys` → NUNCA exposta ao client, só Edge Function/API route com service role.

---

## 6. Telas

### 6.1 Landing (`/`)
Página de vendas dark (zinc-950), estilo Umbra:
1. **Hero:** headline "Descubra as ofertas que estão ESCALANDO no Facebook Ads" + subheadline em BRL vs concorrentes em dólar + CTA amber-500 "Começar agora" + mock do dashboard.
2. **Prova do problema:** "Você testa criativo no escuro enquanto outros copiam o que já funciona."
3. **Demonstração:** grid de 3 cards de anúncios reais com Scale Score (blur parcial p/ gerar curiosidade).
4. **Como funciona:** 3 passos — Busque → Monitore → Receba alertas.
5. **Features:** Scale Score, foco Brasil, alertas de página, dados históricos.
6. **Planos:** 3 cards (Básico/Pro/Elite), Pro em destaque com borda amber.
7. **FAQ + garantia 7 dias.**
8. Footer com termos ("dados públicos da Meta Ad Library").

### 6.2 Login (`/login`)
- Supabase Auth: e-mail/senha + magic link + Google OAuth.
- Card zinc-900 centralizado, logo UmbraAds, borda zinc-800.
- Cadastro cria row em `profiles` via trigger. Redirect → `/dashboard`.

### 6.3 Dashboard (`/dashboard`)
Layout do app: **sidebar fixa** (zinc-900) com Dashboard · Ofertas Escaladas · Monitorando · Rastreados/Alertas · Ajustes. Badge do plano no rodapé da sidebar.

Conteúdo:
1. **Linha de stats (4 cards):** Ofertas escalando hoje · Novos anúncios de páginas rastreadas · Alertas não lidos · Ofertas no seu radar (monitoradas).
2. **Top 10 escalando agora:** mini-grid dos maiores Scale Scores das últimas 24h → clica e vai pro detalhe.
3. **Feed de alertas recentes** (5 últimos) com link para Rastreados/Alertas.
4. **Suas ofertas monitoradas** que mudaram de status (ex.: variações caindo → alerta red).

### 6.4 Ofertas Escaladas (`/ofertas`)
A tela principal do produto — feed de descoberta:

- **Barra de filtros (sticky):** palavra-chave · nicho · país (default BR) · idioma · tipo de criativo · dias ativo (slider) · mínimo de variações · status (ativo/morto) · ordenação (Scale Score, mais recente, mais antigo ainda ativo).
- **Grid de cards (3–4 col):** preview do criativo, page_name, dot de status, dias ativo, nº de variações, Scale Score em amber, botões rápidos: 👁 Monitorar · 🔔 Rastrear página.
- Paginação infinita (cursor no Supabase).
- **Limite por plano:** Free 10 buscas/dia · Básico 50 · Pro/Elite ilimitado (contador `buscas_hoje` no profile, reset via cron).

### 6.5 Detalhe do Anúncio (`/ofertas/[id]`)
Subpágina do anúncio:

- **Coluna esquerda:** criativo grande (vídeo com player / imagem), carrossel de variações.
- **Coluna direita:**
  - Copy completa com botão "Copiar" (feedback emerald).
  - CTA, link da landing (abrir em nova aba), país, idioma, nicho.
  - **Métricas:** dias ativo, variações ativas, Scale Score grande em amber.
  - **Gráfico:** evolução de anúncios ativos da página (via `page_snapshots`, Recharts).
  - Botões: **Monitorar oferta** (amber-500) · **Rastrear página** · Ver todos anúncios da página.
- **Seção inferior:** outros anúncios da mesma página (grid).

### 6.6 Monitorando (`/monitorando`)
Acompanhamento contínuo das ofertas que o usuário marcou:

- **Tabela/lista** com: criativo (thumb), página, status da verificação (`observando` amber · `validada` emerald · `morta` red), dias ativo, variações (com seta ↑↓ vs semana passada), Scale Score atual, campo de nota pessoal, ações (ver detalhe / remover).
- **Verificação contínua:** o cron diário re-checa cada anúncio monitorado na API. Se as variações caírem >50% ou o anúncio morrer → status muda + alerta gerado.
- Filtro por status e ordenação por última mudança.
- Limite: Free 3 · Básico 15 · Pro 50 · Elite ilimitado.

### 6.7 Rastreados / Alertas (`/rastreados`)
Duas abas:

**Aba Rastreados:**
- Formulário: adicionar página (colar link/ID) ou palavra-chave.
- Lista dos rastreios ativos com toggle on/off e contagem de alertas gerados.
- Limite: Básico 3 · Pro 15 · Elite 50.

**Aba Alertas:**
- Feed cronológico: "Página X subiu 12 anúncios novos hoje" · "Oferta Y explodiu de 8 → 31 variações" · "Oferta Z que você monitorava morreu".
- Não lido = borda esquerda amber; marcar todos como lidos.
- (v2: alertas também por e-mail via Resend.)

### 6.8 Ajustes (`/ajustes`)
- **Conta:** e-mail, trocar senha, deletar conta.
- **Plano:** plano atual, uso (buscas hoje, monitorados, rastreados), botão upgrade → checkout Kiwify/Cakto.
- **Preferências:** país padrão de busca, nichos favoritos, receber alertas por e-mail (v2).
- **Sessões / sair.**

---

## 7. Estrutura do Projeto

```
umbraads/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx                 # Landing
│   ├── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx               # Sidebar + guard de auth
│   │   ├── dashboard/page.tsx
│   │   ├── ofertas/
│   │   │   ├── page.tsx             # Feed com filtros
│   │   │   └── [id]/page.tsx        # Detalhe do anúncio
│   │   ├── monitorando/page.tsx
│   │   ├── rastreados/page.tsx      # Abas rastreados + alertas
│   │   └── ajustes/page.tsx
│   └── api/
│       ├── search/route.ts          # Busca c/ cache
│       ├── ads/[id]/route.ts
│       ├── cron/refresh/route.ts    # Vercel Cron diário
│       └── webhooks/kiwify/route.ts # Ativação de plano
├── lib/
│   ├── supabase/ (client.ts, server.ts, admin.ts)
│   ├── providers/ (index.ts, provider-a.ts, provider-b.ts, key-manager.ts)
│   └── scale-score.ts
├── components/
│   ├── ui/ (button, card, badge, input, tabs...)
│   ├── ad-card.tsx
│   ├── filters-bar.tsx
│   ├── scale-badge.tsx
│   └── sidebar.tsx
└── supabase/migrations/
```

**Crons (Vercel Cron):**
- `0 6 * * *` → refresh de monitorados + rastreados, recálculo de Scale Score, snapshot de páginas, geração de alertas.
- `0 0 * * *` → reset de `buscas_hoje`.

---

## 8. Monetização

| Plano | Preço | Buscas/dia | Monitorados | Rastreados | Extras |
|---|---|---|---|---|---|
| Free (isca) | R$0 | 10 | 3 | 0 | Scale Score borrado |
| Básico | R$47/mês | 50 | 15 | 3 | — |
| Pro ⭐ | R$97/mês | Ilimitado | 50 | 15 | Alertas, histórico 90d |
| Elite | R$197/mês | Ilimitado | Ilimitado | 50 | Export CSV, histórico completo, acesso antecipado |

Webhook Kiwify/Cakto → `api/webhooks/kiwify` → atualiza `plano` e `plano_expira_em` no profile. Mesmo fluxo já validado no Umbra Copywriter.

---

## 9. Roadmap de Build

**Fase 1 — Fundação (semana 1)**
Repo GitHub + Next.js + Tailwind com paleta · Supabase (schema + RLS + auth) · Login funcionando · Layout do app com sidebar.

**Fase 2 — Motor de dados (semana 2)**
Validar e assinar as 2 melhores APIs no RapidAPI · Adapter + key-manager com as 15+ chaves · API route de busca com cache · Popular banco com primeiras buscas BR (seed).

**Fase 3 — Telas core (semanas 3–4)**
Ofertas Escaladas (feed + filtros) · Detalhe do Anúncio · Scale Score no cron · Dashboard.

**Fase 4 — Retenção (semana 5)**
Monitorando + verificação contínua · Rastreados + geração de alertas · Ajustes.

**Fase 5 — Lançamento (semana 6)**
Landing page · Integração Kiwify/Cakto + limites por plano · Beta com 10–20 pessoas da sua audiência (Obra) · Ajustes e lançamento.

---

## 10. Riscos e Cuidados

1. **Dependência de scraper:** APIs da Ad Library no RapidAPI quebram de vez em quando — por isso o adapter com 2 provedores. Monitorar taxa de erro.
2. **Custo de API:** o cache de 12–24h é inegociável. Sem ele, o plano de R$47 fica no prejuízo.
3. **Termos de uso:** deixar claro na landing que os dados vêm da biblioteca pública da Meta; não prometer métricas privadas (gasto real, CTR) que nenhuma ferramenta tem.
4. **Egress Supabase:** servir thumbnails via URL original da Meta (não re-hospedar criativos no Storage) — só salvar URLs.
5. **Foco:** MVP = telas da seção 6, nada além. Coleções, e-mail de alertas e extensão Chrome ficam para v2.
