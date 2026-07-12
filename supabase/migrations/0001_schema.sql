-- ============================================================================
-- UmbraAds — 0001_schema.sql
-- Tabelas, constraints e índices. (RLS e triggers vêm nas migrations 0002/0003.)
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- profiles — 1:1 com auth.users. Plano e cota diária de buscas.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  email            text,
  plano            text not null default 'free'
                     check (plano in ('free', 'basico', 'pro', 'elite')),
  plano_expira_em  timestamptz,
  buscas_hoje      int not null default 0,
  created_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- pages — página/anunciante do Facebook rastreada.
-- ----------------------------------------------------------------------------
create table if not exists public.pages (
  page_id             text primary key,
  nome                text,
  anuncios_ativos     int not null default 0,
  primeiro_visto      timestamptz not null default now(),
  ultima_verificacao  timestamptz
);

-- ----------------------------------------------------------------------------
-- ads — anúncio normalizado da Meta Ad Library. Coração do produto.
-- ----------------------------------------------------------------------------
create table if not exists public.ads (
  id                   uuid primary key default gen_random_uuid(),
  ad_archive_id        text not null unique,
  page_id              text not null,
  page_name            text,
  tipo_criativo        text,
  copy_texto           text,
  cta                  text,
  link_destino         text,
  snapshot_url         text,
  pais                 text not null default 'BR',
  nicho                text,
  idioma               text,
  ativo                boolean not null default true,
  data_inicio          date,
  dias_ativo           int,
  variacoes_ativas     int not null default 1,
  variacoes_7d_atras   int,
  scale_score          int not null default 0,
  primeiro_visto       timestamptz not null default now(),
  ultima_verificacao   timestamptz not null default now()
);

create index if not exists ads_scale_score_idx on public.ads (scale_score desc);
create index if not exists ads_page_id_idx     on public.ads (page_id);
create index if not exists ads_nicho_pais_idx  on public.ads (nicho, pais);
create index if not exists ads_ativo_idx       on public.ads (ativo);

-- ----------------------------------------------------------------------------
-- page_snapshots — série temporal de anúncios ativos por página (gráficos).
-- ----------------------------------------------------------------------------
create table if not exists public.page_snapshots (
  id               bigserial primary key,
  page_id          text not null references public.pages (page_id) on delete cascade,
  data             date not null,
  anuncios_ativos  int,
  unique (page_id, data)
);

create index if not exists page_snapshots_page_data_idx
  on public.page_snapshots (page_id, data);

-- ----------------------------------------------------------------------------
-- monitorados — anúncios que o usuário salvou para acompanhar.
-- ----------------------------------------------------------------------------
create table if not exists public.monitorados (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  ad_id      uuid not null references public.ads (id) on delete cascade,
  nota       text,
  status     text not null default 'observando'
               check (status in ('observando', 'validada', 'morta')),
  criado_em  timestamptz not null default now(),
  unique (user_id, ad_id)
);

create index if not exists monitorados_user_idx on public.monitorados (user_id);

-- ----------------------------------------------------------------------------
-- rastreados — páginas ou keywords que o usuário quer vigiar (gera alertas).
-- ----------------------------------------------------------------------------
create table if not exists public.rastreados (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  tipo       text not null check (tipo in ('pagina', 'keyword')),
  valor      text not null,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create index if not exists rastreados_user_idx on public.rastreados (user_id);

-- ----------------------------------------------------------------------------
-- alertas — eventos gerados pelo cron para o usuário.
-- ----------------------------------------------------------------------------
create table if not exists public.alertas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  rastreado_id  uuid references public.rastreados (id) on delete set null,
  tipo          text not null
                  check (tipo in ('novo_anuncio', 'explosao_variacoes', 'oferta_morta')),
  titulo        text,
  payload       jsonb,
  lido          boolean not null default false,
  criado_em     timestamptz not null default now()
);

create index if not exists alertas_user_lido_idx on public.alertas (user_id, lido);
create index if not exists alertas_criado_idx    on public.alertas (criado_em desc);

-- ----------------------------------------------------------------------------
-- api_keys — pool de chaves da RapidAPI (só service role acessa).
-- ----------------------------------------------------------------------------
create table if not exists public.api_keys (
  id             uuid primary key default gen_random_uuid(),
  provedor       text not null,
  chave          text not null,
  limite_mensal  int,
  uso_atual      int not null default 0,
  status         text not null default 'ativa'
                   check (status in ('ativa', 'cooldown', 'esgotada')),
  cooldown_ate   timestamptz,
  renova_em      date
);

-- ----------------------------------------------------------------------------
-- query_cache — cache de buscas (só service role acessa).
-- ----------------------------------------------------------------------------
create table if not exists public.query_cache (
  id             uuid primary key default gen_random_uuid(),
  query_hash     text not null unique,
  ad_ids         uuid[],
  atualizado_em  timestamptz not null default now()
);
