-- ============================================================================
-- UmbraAds — setup.sql (TUDO NA ORDEM CERTA)
-- Gerado automaticamente: migrations 0001->0004 + seed, na sequência correta.
-- Cole este arquivo INTEIRO no SQL Editor do Supabase e rode uma vez.
-- ============================================================================


-- ▼▼▼ migrations/0001_schema.sql ▼▼▼

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


-- ▼▼▼ migrations/0002_rls.sql ▼▼▼

-- ============================================================================
-- UmbraAds — 0002_rls.sql
-- Row Level Security em TODAS as tabelas.
--
-- Regras:
--  - Dados do usuário (profiles/monitorados/rastreados/alertas): o dono só
--    enxerga/mexe nas próprias linhas (auth.uid()).
--  - Catálogo (ads/pages/page_snapshots): leitura para qualquer autenticado;
--    escrita só via service role (que bypassa RLS por padrão).
--  - api_keys e query_cache: NENHUMA policy → nenhum client consegue tocar.
--    Apenas a service role (admin client no servidor) acessa.
-- ============================================================================

-- Habilita RLS em tudo -------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.ads            enable row level security;
alter table public.pages          enable row level security;
alter table public.page_snapshots enable row level security;
alter table public.monitorados    enable row level security;
alter table public.rastreados     enable row level security;
alter table public.alertas        enable row level security;
alter table public.api_keys       enable row level security;
alter table public.query_cache    enable row level security;

-- ----------------------------------------------------------------------------
-- profiles — dono = auth.uid() = id
-- ----------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- ads / pages / page_snapshots — leitura para autenticados; escrita = service role
-- ----------------------------------------------------------------------------
create policy "ads_select_authenticated" on public.ads
  for select to authenticated using (true);

create policy "pages_select_authenticated" on public.pages
  for select to authenticated using (true);

create policy "page_snapshots_select_authenticated" on public.page_snapshots
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- monitorados — dono = auth.uid() = user_id
-- ----------------------------------------------------------------------------
create policy "monitorados_select_own" on public.monitorados
  for select to authenticated using (auth.uid() = user_id);

create policy "monitorados_insert_own" on public.monitorados
  for insert to authenticated with check (auth.uid() = user_id);

create policy "monitorados_update_own" on public.monitorados
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "monitorados_delete_own" on public.monitorados
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- rastreados — dono = auth.uid() = user_id
-- ----------------------------------------------------------------------------
create policy "rastreados_select_own" on public.rastreados
  for select to authenticated using (auth.uid() = user_id);

create policy "rastreados_insert_own" on public.rastreados
  for insert to authenticated with check (auth.uid() = user_id);

create policy "rastreados_update_own" on public.rastreados
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "rastreados_delete_own" on public.rastreados
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- alertas — dono = auth.uid() = user_id
-- ----------------------------------------------------------------------------
create policy "alertas_select_own" on public.alertas
  for select to authenticated using (auth.uid() = user_id);

create policy "alertas_insert_own" on public.alertas
  for insert to authenticated with check (auth.uid() = user_id);

create policy "alertas_update_own" on public.alertas
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "alertas_delete_own" on public.alertas
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- api_keys e query_cache — SEM policies de propósito.
-- Com RLS habilitado e nenhuma policy, todo acesso via client é negado.
-- Só a service role (que ignora RLS) enxerga essas tabelas.
-- ----------------------------------------------------------------------------


-- ▼▼▼ migrations/0003_triggers.sql ▼▼▼

-- ============================================================================
-- UmbraAds — 0003_triggers.sql
-- Ao criar um usuário no auth.users, cria automaticamente o profile.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ▼▼▼ migrations/0004_preferencias.sql ▼▼▼

-- ============================================================================
-- UmbraAds — 0004_preferencias.sql
-- Preferências do usuário (país padrão de busca, nichos favoritos) em jsonb.
-- ============================================================================

alter table public.profiles
  add column if not exists preferencias jsonb not null default '{}'::jsonb;


-- ▼▼▼ seed.sql ▼▼▼

-- ============================================================================
-- UmbraAds — seed.sql
-- Dados fictícios BR para desenvolvimento: 10 páginas, 30 anúncios em 5 nichos
-- (achadinhos, beleza, pet, renda extra, casa & cozinha) com scores variados,
-- e 60 dias de snapshots por página para os gráficos.
--
-- Scale Score segue a fórmula do produto:
--   score = (variacoes_ativas * 2) + (crescimento_7d * 5) + min(dias_ativo, 60)
--   crescimento_7d = variacoes_ativas - variacoes_7d_atras
-- Os valores de scale_score abaixo já estão calculados de forma consistente.
--
-- Idempotente: pode rodar mais de uma vez (usa ON CONFLICT).
-- ============================================================================

-- ------------------------------------------------------------------ PÁGINAS --
insert into public.pages (page_id, nome, anuncios_ativos, ultima_verificacao) values
  ('100000000000001', 'Achadinhos da Shopee BR', 28, now()),
  ('100000000000002', 'Ofertas Relâmpago BR',    16, now()),
  ('100000000000003', 'Glow Beleza Oficial',     24, now()),
  ('100000000000004', 'Sérum Vitamina C Brasil',  15, now()),
  ('100000000000005', 'Mundo Pet Feliz',          20, now()),
  ('100000000000006', 'PetShop Amoreco',          13, now()),
  ('100000000000007', 'Renda Extra Já',           26, now()),
  ('100000000000008', 'Método Lucro Digital',     18, now()),
  ('100000000000009', 'Cozinha Prática BR',       22, now()),
  ('100000000000010', 'Casa & Conforto',          30, now())
on conflict (page_id) do update
  set nome = excluded.nome,
      anuncios_ativos = excluded.anuncios_ativos,
      ultima_verificacao = excluded.ultima_verificacao;

-- ------------------------------------------------------------------ ANÚNCIOS --
-- Colunas: ad_archive_id, page_id, page_name, tipo_criativo, copy_texto, cta,
--          link_destino, nicho, idioma, ativo, data_inicio, dias_ativo,
--          variacoes_ativas, variacoes_7d_atras, scale_score
insert into public.ads (
  ad_archive_id, page_id, page_name, tipo_criativo, copy_texto, cta,
  link_destino, pais, nicho, idioma, ativo, data_inicio, dias_ativo,
  variacoes_ativas, variacoes_7d_atras, scale_score
) values
  -- Achadinhos da Shopee BR ---------------------------------------------------
  ('9000000000000001','100000000000001','Achadinhos da Shopee BR','VIDEO','O achadinho que TODO MUNDO tá comprando 🔥 Frete grátis só hoje. Corre que acaba!','Comprar agora','https://loja.exemplo.com/achadinho','BR','achadinhos','pt',true, current_date - 52, 52, 22, 9, 161),
  ('9000000000000002','100000000000001','Achadinhos da Shopee BR','IMAGE','Organizador de gaveta que virou febre. Sua casa merece.','Saiba mais','https://loja.exemplo.com/organizador','BR','achadinhos','pt',true, current_date - 20, 20, 6, 5, 37),
  ('9000000000000003','100000000000001','Achadinhos da Shopee BR','IMAGE','Kit 3 peças por menos de R$30. Últimas unidades.','Comprar agora','https://loja.exemplo.com/kit3','BR','achadinhos','pt',true, current_date - 9, 9, 2, 3, 8),
  -- Ofertas Relâmpago BR ------------------------------------------------------
  ('9000000000000004','100000000000002','Ofertas Relâmpago BR','VIDEO','ESGOTANDO: mini projetor que transforma sua parede em cinema 🎬','Comprar agora','https://loja.exemplo.com/projetor','BR','achadinhos','pt',true, current_date - 38, 38, 14, 6, 106),
  ('9000000000000005','100000000000002','Ofertas Relâmpago BR','IMAGE','Fone bluetooth com cancelamento de ruído por um precinho.','Ver oferta','https://loja.exemplo.com/fone','BR','achadinhos','pt',true, current_date - 15, 15, 4, 4, 23),
  -- Glow Beleza Oficial -------------------------------------------------------
  ('9000000000000006','100000000000003','Glow Beleza Oficial','VIDEO','A pele dela mudou em 14 dias. Antes e depois REAL 👇','Comprar agora','https://loja.exemplo.com/glow-serum','BR','beleza','pt',true, current_date - 47, 47, 19, 7, 145),
  ('9000000000000007','100000000000003','Glow Beleza Oficial','IMAGE','Rotina de skincare completa por menos que um batom importado.','Saiba mais','https://loja.exemplo.com/rotina','BR','beleza','pt',true, current_date - 26, 26, 9, 6, 59),
  ('9000000000000008','100000000000003','Glow Beleza Oficial','IMAGE','Máscara facial que viralizou no TikTok. Testa e me conta.','Ver oferta','https://loja.exemplo.com/mascara','BR','beleza','pt',true, current_date - 11, 11, 3, 3, 17),
  -- Sérum Vitamina C Brasil ---------------------------------------------------
  ('9000000000000009','100000000000004','Sérum Vitamina C Brasil','VIDEO','Vitamina C pura que clareia manchas de sol. Dermato aprovou.','Comprar agora','https://loja.exemplo.com/vitc','BR','beleza','pt',true, current_date - 33, 33, 12, 5, 92),
  ('9000000000000010','100000000000004','Sérum Vitamina C Brasil','IMAGE','Frasco de 30ml que dura 3 meses. Faz as contas.','Saiba mais','https://loja.exemplo.com/vitc-30','BR','beleza','pt',true, current_date - 22, 22, 7, 8, 31),
  ('9000000000000011','100000000000004','Sérum Vitamina C Brasil','IMAGE','[PAUSADO] Promo de lançamento encerrada.','Ver oferta','https://loja.exemplo.com/vitc-promo','BR','beleza','pt',false, current_date - 41, 41, 1, 6, 18),
  -- Mundo Pet Feliz -----------------------------------------------------------
  ('9000000000000012','100000000000005','Mundo Pet Feliz','VIDEO','Seu cachorro vai AMAR esse tapete lambedor. Anti-ansiedade 🐶','Comprar agora','https://loja.exemplo.com/tapete-pet','BR','pet','pt',true, current_date - 40, 40, 16, 6, 122),
  ('9000000000000013','100000000000005','Mundo Pet Feliz','IMAGE','Comedouro antifúngico que mantém a ração fresquinha.','Saiba mais','https://loja.exemplo.com/comedouro','BR','pet','pt',true, current_date - 24, 24, 8, 7, 45),
  ('9000000000000014','100000000000005','Mundo Pet Feliz','IMAGE','Escova removedora de pelos. Adeus sofá cheio de pelo.','Ver oferta','https://loja.exemplo.com/escova-pet','BR','pet','pt',true, current_date - 7, 7, 2, 2, 11),
  -- PetShop Amoreco -----------------------------------------------------------
  ('9000000000000015','100000000000006','PetShop Amoreco','VIDEO','Fonte de água para gatos que incentiva a hidratação. Vira febre.','Comprar agora','https://loja.exemplo.com/fonte-gato','BR','pet','pt',true, current_date - 30, 30, 11, 4, 87),
  ('9000000000000016','100000000000006','PetShop Amoreco','IMAGE','Cama pet ortopédica com preço de cama comum.','Saiba mais','https://loja.exemplo.com/cama-pet','BR','pet','pt',true, current_date - 18, 18, 5, 5, 28),
  ('9000000000000017','100000000000006','PetShop Amoreco','DCO','[ENCERRADO] Campanha de Natal finalizada.','Ver oferta','https://loja.exemplo.com/natal-pet','BR','pet','pt',false, current_date - 55, 55, 1, 9, 17),
  -- Renda Extra Já ------------------------------------------------------------
  ('9000000000000018','100000000000007','Renda Extra Já','VIDEO','Ela fatura R$5k/mês de casa com o celular. Veja o método 👇','Cadastre-se','https://loja.exemplo.com/renda-metodo','BR','renda extra','pt',true, current_date - 49, 49, 20, 8, 149),
  ('9000000000000019','100000000000007','Renda Extra Já','VIDEO','Aula GRÁTIS: como começar a vender online sem estoque.','Cadastre-se','https://loja.exemplo.com/aula-gratis','BR','renda extra','pt',true, current_date - 28, 28, 10, 7, 63),
  ('9000000000000020','100000000000007','Renda Extra Já','IMAGE','E-book de 47 fontes de renda extra. Baixe agora.','Baixar','https://loja.exemplo.com/ebook-renda','BR','renda extra','pt',true, current_date - 12, 12, 3, 4, 13),
  -- Método Lucro Digital ------------------------------------------------------
  ('9000000000000021','100000000000008','Método Lucro Digital','VIDEO','O passo a passo que tirou o João do zero aos R$10k. Assista.','Cadastre-se','https://loja.exemplo.com/lucro-digital','BR','renda extra','pt',true, current_date - 36, 36, 15, 5, 116),
  ('9000000000000022','100000000000008','Método Lucro Digital','IMAGE','Mentoria com vagas limitadas. Últimos dias de inscrição.','Saiba mais','https://loja.exemplo.com/mentoria','BR','renda extra','pt',true, current_date - 19, 19, 6, 6, 31),
  ('9000000000000023','100000000000008','Método Lucro Digital','IMAGE','[FINALIZADO] Turma anterior esgotada.','Ver oferta','https://loja.exemplo.com/turma','BR','renda extra','pt',false, current_date - 48, 48, 1, 7, 20),
  -- Cozinha Prática BR --------------------------------------------------------
  ('9000000000000024','100000000000009','Cozinha Prática BR','VIDEO','A panela que não gruda NADA e lava em 2 segundos. Testei ao vivo 🍳','Comprar agora','https://loja.exemplo.com/panela','BR','casa & cozinha','pt',true, current_date - 43, 43, 17, 6, 132),
  ('9000000000000025','100000000000009','Cozinha Prática BR','IMAGE','Kit potes herméticos que organiza toda a despensa.','Saiba mais','https://loja.exemplo.com/potes','BR','casa & cozinha','pt',true, current_date - 25, 25, 8, 6, 51),
  ('9000000000000026','100000000000009','Cozinha Prática BR','IMAGE','Descascador 3 em 1 que economiza tempo na cozinha.','Ver oferta','https://loja.exemplo.com/descascador','BR','casa & cozinha','pt',true, current_date - 10, 10, 3, 3, 16),
  -- Casa & Conforto -----------------------------------------------------------
  ('9000000000000027','100000000000010','Casa & Conforto','VIDEO','Luminária de mesa que muda o clima do quarto. 16 cores 🌈','Comprar agora','https://loja.exemplo.com/luminaria','BR','casa & cozinha','pt',true, current_date - 35, 35, 13, 5, 101),
  ('9000000000000028','100000000000010','Casa & Conforto','IMAGE','Jogo de cama que parece de hotel 5 estrelas. Toque macio.','Saiba mais','https://loja.exemplo.com/jogo-cama','BR','casa & cozinha','pt',true, current_date - 27, 27, 9, 9, 45),
  ('9000000000000029','100000000000010','Casa & Conforto','IMAGE','Umidificador com luz de LED. Ambiente aconchegante.','Ver oferta','https://loja.exemplo.com/umidificador','BR','casa & cozinha','pt',true, current_date - 14, 14, 4, 5, 17),
  ('9000000000000030','100000000000010','Casa & Conforto','VIDEO','O organizador de guarda-roupa que dobra seu espaço. VIRALIZOU.','Comprar agora','https://loja.exemplo.com/organizador-roupa','BR','casa & cozinha','pt',true, current_date - 58, 58, 21, 7, 170)
on conflict (ad_archive_id) do update
  set page_name = excluded.page_name,
      tipo_criativo = excluded.tipo_criativo,
      copy_texto = excluded.copy_texto,
      cta = excluded.cta,
      link_destino = excluded.link_destino,
      nicho = excluded.nicho,
      ativo = excluded.ativo,
      data_inicio = excluded.data_inicio,
      dias_ativo = excluded.dias_ativo,
      variacoes_ativas = excluded.variacoes_ativas,
      variacoes_7d_atras = excluded.variacoes_7d_atras,
      scale_score = excluded.scale_score,
      ultima_verificacao = now();

-- --------------------------------------------------------------- SNAPSHOTS ---
-- 60 dias por página. anuncios_ativos vai de base_start → base_end (tendência),
-- com uma leve oscilação senoidal pra não ficar uma reta perfeita.
insert into public.page_snapshots (page_id, data, anuncios_ativos)
select
  p.page_id,
  (current_date - (59 - g.i))::date as data,
  greatest(
    1,
    round(
      p.base_start
      + (p.base_end - p.base_start) * (g.i::numeric / 59)
      + 1.5 * sin(g.i::numeric / 3)
    )
  )::int as anuncios_ativos
from (values
  ('100000000000001',  6, 28),
  ('100000000000002',  4, 16),
  ('100000000000003',  5, 24),
  ('100000000000004',  8, 15),
  ('100000000000005',  5, 20),
  ('100000000000006',  6, 13),
  ('100000000000007',  7, 26),
  ('100000000000008',  4, 18),
  ('100000000000009',  5, 22),
  ('100000000000010',  3, 30)
) as p(page_id, base_start, base_end)
cross join generate_series(0, 59) as g(i)
on conflict (page_id, data) do update
  set anuncios_ativos = excluded.anuncios_ativos;

-- --------------------------------------------------------------- API KEYS ----
-- NÃO commitamos chaves reais aqui. Insira sua chave da RapidAPI direto no
-- banco (ou via painel) quando chegar na FASE 5. Exemplo:
--
-- insert into public.api_keys (provedor, chave, limite_mensal)
-- values ('facebook-scraper3', '<SUA_CHAVE_RAPIDAPI>', 100000);

-- ------------------------------------------ DADOS POR USUÁRIO (opcional) ------
-- monitorados / rastreados / alertas dependem de um usuário real (auth.users).
-- Depois de criar sua conta em /login, pegue seu id em Auth > Users e rode,
-- trocando :uid pelo seu UUID (no psql/SQL editor use um bloco assim):
--
-- with u as (select '<SEU_USER_UUID>'::uuid as uid)
-- insert into public.monitorados (user_id, ad_id, status, nota)
-- select u.uid, a.id, 'observando', 'Modelar essa copy'
-- from u, public.ads a
-- where a.ad_archive_id in ('9000000000000001','9000000000000006','9000000000000018')
-- on conflict (user_id, ad_id) do nothing;
--
-- with u as (select '<SEU_USER_UUID>'::uuid as uid)
-- insert into public.rastreados (user_id, tipo, valor)
-- values
--   ((select uid from u), 'pagina',  '100000000000003'),
--   ((select uid from u), 'keyword', 'fritadeira')
-- on conflict do nothing;

