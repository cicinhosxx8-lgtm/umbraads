-- ============================================================================
-- UmbraAds — 0004_preferencias.sql
-- Preferências do usuário (país padrão de busca, nichos favoritos) em jsonb.
-- ============================================================================

alter table public.profiles
  add column if not exists preferencias jsonb not null default '{}'::jsonb;
