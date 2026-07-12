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
