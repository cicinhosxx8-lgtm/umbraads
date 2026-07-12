# UmbraAds — Prompt para o Claude Code construir o app

> **Antes de colar o prompt, prepare o terreno (2 min):**
> 1. Crie a pasta do projeto e entre nela: `mkdir umbraads && cd umbraads`
> 2. Dentro dela, crie a pasta `design-reference/` e salve os HTMLs exportados do Claude Design com estes nomes: `landing.html`, `login.html`, `dashboard.html`, `ofertas.html`, `detalhe-anuncio.html`, `monitorando.html`, `rastreados.html`, `ajustes.html`
> 3. Abra o Claude Code na pasta e cole o **PROMPT MESTRE** abaixo.
>
> O prompt já manda ele trabalhar em fases e parar pra você validar entre uma e outra — não deixa ele sair correndo e fazer tudo de uma vez sem você conferir.

---

## PROMPT MESTRE (colar no Claude Code)

```
Você vai construir o UmbraAds: um SaaS de espionagem de anúncios do Facebook Ads (Meta Ad Library) para o mercado brasileiro. Eu já criei TODAS as telas em HTML — elas estão na pasta ./design-reference/. Sua missão é transformar esses HTMLs em um app Next.js real, funcional e conectado ao Supabase.

REGRA Nº 1 — FIDELIDADE VISUAL: os HTMLs em ./design-reference/ são a fonte da verdade do visual. Ao converter para React, preserve layout, espaçamentos, cores e hierarquia EXATAMENTE como estão. Não "melhore" o design por conta própria. Extraia os padrões repetidos (card de anúncio, badge de Scale Score, sidebar, botões, inputs) para componentes reutilizáveis em vez de duplicar markup.

REGRA Nº 2 — TRABALHE EM FASES: execute uma fase por vez, na ordem abaixo. Ao terminar cada fase, PARE, me mostre um resumo do que foi feito e como testar, e espere meu OK antes de seguir.

REGRA Nº 3 — SEGURANÇA: chaves da RapidAPI e service role do Supabase existem SÓ no servidor (API routes / env). Nunca em client component, nunca commitadas. Crie .env.example documentado e .env.local no .gitignore.

========================================
STACK
========================================
- Next.js 14+ (App Router) + TypeScript strict
- Tailwind CSS
- Supabase: Postgres + Auth (@supabase/ssr) + RLS
- Deploy alvo: Vercel (incluindo Vercel Cron)
- Gráficos: Recharts
- Ícones: lucide-react

========================================
DESIGN TOKENS (já refletidos nos HTMLs)
========================================
Fundo app: zinc-950 #09090b · Cards: zinc-900 #18181b · Bordas: zinc-800 #27272a (hover zinc-700)
Textos: títulos zinc-100, corpo zinc-300, apoio zinc-400, labels zinc-500
Primária: amber-500 #f59e0b (hover amber-400) — botões primários, Scale Score, item ativo da sidebar
Semânticas: emerald-500/400 = ativo/sucesso/crescimento · red-500/400 = morto/queda/erro · violet-500/400 = badge "Validada 30d+"
Fonte: Inter. Métricas com font-semibold e tabular-nums.
Scale Score: 0–30 Fraco (zinc-500) · 31–70 Aquecendo (amber-400) · 71+ ESCALANDO (amber-500 + badge).

========================================
ESTRUTURA DE ROTAS
========================================
/                    → Landing (design-reference/landing.html) — pública
/login               → Login/Cadastro (login.html) — pública
/dashboard           → dashboard.html — protegida
/ofertas             → ofertas.html (feed com filtros) — protegida
/ofertas/[id]        → detalhe-anuncio.html — protegida
/monitorando         → monitorando.html — protegida
/rastreados          → rastreados.html (tabs Rastreados + Alertas) — protegida
/ajustes             → ajustes.html — protegida

Rotas protegidas ficam num route group (app)/ com layout que tem a sidebar + topbar e faz guard de sessão via middleware do Supabase (@supabase/ssr). Sem sessão → redirect /login.

========================================
BANCO (criar como migrations em supabase/migrations/)
========================================
profiles: id uuid pk ref auth.users, email text, plano text default 'free' (free|basico|pro|elite), plano_expira_em timestamptz, buscas_hoje int default 0, created_at timestamptz default now(). Trigger: ao criar user no auth, insere profile.

ads: id uuid pk default gen_random_uuid(), ad_archive_id text unique not null, page_id text not null, page_name text, tipo_criativo text, copy_texto text, cta text, link_destino text, snapshot_url text, pais text default 'BR', nicho text, idioma text, ativo boolean default true, data_inicio date, dias_ativo int, variacoes_ativas int default 1, variacoes_7d_atras int, scale_score int default 0, primeiro_visto timestamptz default now(), ultima_verificacao timestamptz default now().
Índices: scale_score desc; page_id; (nicho, pais); ativo.

pages: page_id text pk, nome text, anuncios_ativos int default 0, primeiro_visto timestamptz default now(), ultima_verificacao timestamptz.

page_snapshots: id bigserial pk, page_id text ref pages, data date, anuncios_ativos int, unique(page_id, data).

monitorados: id uuid pk, user_id uuid ref profiles, ad_id uuid ref ads, nota text, status text default 'observando' (observando|validada|morta), criado_em timestamptz default now(), unique(user_id, ad_id).

rastreados: id uuid pk, user_id uuid ref profiles, tipo text ('pagina'|'keyword'), valor text, ativo boolean default true, criado_em timestamptz default now().

alertas: id uuid pk, user_id uuid ref profiles, rastreado_id uuid ref rastreados null, tipo text ('novo_anuncio'|'explosao_variacoes'|'oferta_morta'), titulo text, payload jsonb, lido boolean default false, criado_em timestamptz default now().

api_keys: id uuid pk, provedor text, chave text, limite_mensal int, uso_atual int default 0, status text default 'ativa' (ativa|cooldown|esgotada), cooldown_ate timestamptz, renova_em date.

query_cache: id uuid pk, query_hash text unique, ad_ids uuid[], atualizado_em timestamptz default now().

RLS: habilitar em tudo. profiles/monitorados/rastreados/alertas → select/insert/update/delete só onde auth.uid() = user_id (profiles: auth.uid() = id). ads/pages/page_snapshots → select para authenticated; escrita só service role. api_keys e query_cache → NENHUMA policy para client (só service role acessa).

========================================
CAMADA DE DADOS (lib/providers/)
========================================
- types.ts: interface AdProvider { searchAds(filtros): NormalizedAd[]; getAd(adArchiveId): NormalizedAd; getPageAds(pageId): NormalizedAd[] } e o tipo NormalizedAd espelhando a tabela ads.
- key-manager.ts: busca em api_keys a chave 'ativa' com menor uso_atual/limite_mensal; incrementa uso a cada chamada; em resposta 429, marca status='cooldown' e cooldown_ate = now()+1h e tenta a próxima; se todas esgotadas, lança erro tratado que a API route converte em resposta amigável.
- provider-facebook-adlibrary.ts: adapter da API principal da RapidAPI (deixe a URL base e o mapeamento de campos em constantes fáceis de editar no topo do arquivo, com comentários TODO indicando onde eu preencho endpoint e campos reais — eu ainda vou escolher a API exata no RapidAPI).
- scale-score.ts: score = (variacoes_ativas * 2) + (crescimento_7d * 5) + min(dias_ativo, 60).

FLUXO DE BUSCA COM CACHE (app/api/search/route.ts):
1. Normaliza filtros → gera query_hash (hash estável do JSON ordenado).
2. Procura em query_cache: se existe e atualizado_em < 12h → busca os ads por id no banco e retorna.
3. Senão → chama o provider via key-manager, faz upsert dos ads (por ad_archive_id), grava query_cache, retorna.
4. Antes de tudo: checa limite de buscas do plano do usuário (free 10/dia, basico 50/dia, pro/elite ilimitado) lendo/incrementando buscas_hoje; se estourou, retorna 402 com mensagem de upgrade.

OUTRAS API ROUTES:
- app/api/ads/[id]/route.ts → detalhe + anúncios da mesma página + snapshots para o gráfico.
- app/api/monitorados/route.ts (GET/POST/DELETE/PATCH nota e status) — respeitando limites do plano (free 3, basico 15, pro 50, elite ∞).
- app/api/rastreados/route.ts (GET/POST/DELETE/toggle) — limites (basico 3, pro 15, elite 50; free 0).
- app/api/alertas/route.ts (GET com paginação, PATCH marcar lidos).
- app/api/cron/refresh/route.ts → protegida por header CRON_SECRET: re-verifica cada ad monitorado/rastreado no provider, atualiza variações/status, recalcula scale_score, grava page_snapshots do dia, gera alertas (novo_anuncio quando página rastreada tem ads novos; explosao_variacoes quando variações ≥ 2x em 7d; oferta_morta quando ativo vira false ou variações caem >50%), e muda status de monitorados (morta / validada quando dias_ativo ≥ 30).
- app/api/cron/reset-buscas/route.ts → zera buscas_hoje.
- app/api/webhooks/pagamento/route.ts → webhook Kiwify/Cakto: valida token, mapeia produto→plano, atualiza profile (deixar o mapeamento em constantes com TODO).
vercel.json com os 2 crons: refresh 06:00 UTC, reset 00:00 UTC.

========================================
FASES DE EXECUÇÃO
========================================
FASE 1 — Fundação: scaffold Next.js + TS + Tailwind (tokens no config), estrutura de pastas, clients Supabase (client/server/admin), middleware de auth, migrations completas + seed.sql com ~30 anúncios fictícios BR (nichos: achadinhos, beleza, pet, renda extra, casa & cozinha) com scores variados, páginas e snapshots de 60 dias — pra TODAS as telas nascerem com dados. Git init + .gitignore + README com passo a passo de setup (criar projeto Supabase, rodar migrations, envs, npm run dev).

FASE 2 — Shell + Auth: converter login.html em /login com Supabase Auth real (email/senha + Google OAuth + cadastro), extrair sidebar/topbar do design pra componentes do layout (app)/, guard funcionando.

FASE 3 — Telas core: converter ofertas.html (feed com filtros funcionais via querystring + paginação por cursor lendo do banco), detalhe-anuncio.html (com gráfico Recharts dos snapshots) e dashboard.html (stats e listas calculadas do banco). Componentes compartilhados: AdCard, ScaleBadge, StatusDot, FiltersBar.

FASE 4 — Retenção: monitorando.html (tabela com status, nota editável inline, remover) e rastreados.html (tabs, adicionar/toggle/remover rastreio, feed de alertas com marcar lido). Botões "Monitorar" e "Rastrear" do feed/detalhe ligados de verdade.

FASE 5 — Motor: camada providers + key-manager + rota de busca com cache + crons + webhook de pagamento + ajustes.html (plano & uso com dados reais do profile, conta, preferências). Landing por último: converter landing.html na rota pública /.

Em cada fase: código completo (sem placeholders "// resto aqui"), componentes tipados, e no fim me diga exatamente o que rodar pra testar.

Comece agora pela FASE 1. Antes de escrever código, liste os arquivos de ./design-reference/ que você encontrou e me confirme que consegue ler todos.
```

---

## Prompts de acompanhamento (usar entre as fases)

**Pra aprovar e seguir:**
```
Aprovado. Siga para a FASE X.
```

**Se alguma tela sair diferente do design:**
```
A tela /ofertas saiu diferente do design-reference/ofertas.html. Compare os dois lado a lado e corrija: replique exatamente o layout, espaçamentos e cores do HTML de referência. Não invente variações.
```

**Quando você escolher a API no RapidAPI (Fase 5):**
```
Escolhi a API. Endpoint de busca: [URL]. Headers: X-RapidAPI-Key e X-RapidAPI-Host: [host]. Exemplo de resposta JSON: [colar um retorno real do playground do RapidAPI]. Atualize o provider-facebook-adlibrary.ts pra mapear esses campos pro NormalizedAd.
```

**Pra cadastrar suas 15+ chaves com segurança:**
```
Crie um script scripts/seed-api-keys.ts que lê as chaves de um arquivo local keys.txt (uma por linha, fora do git) e insere na tabela api_keys via service role com limite_mensal que eu passar por argumento. Adicione keys.txt no .gitignore.
```

**Deploy (final):**
```
Prepare o deploy: confira que todas as envs estão no .env.example, gere as instruções pra subir no GitHub e conectar na Vercel, incluindo onde configurar NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET e o secret do webhook. Confirme que o vercel.json dos crons está correto.
```
