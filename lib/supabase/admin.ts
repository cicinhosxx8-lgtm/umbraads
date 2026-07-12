import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Client Supabase com SERVICE ROLE — bypassa RLS.
 * ⚠️ SÓ pode ser importado em código de servidor (API routes, crons,
 * webhooks). O import "server-only" acima faz o build QUEBRAR se alguém
 * tentar puxá-lo para um Client Component. Nunca exponha a service role
 * ao browser.
 *
 * Uso: escrever em ads/pages/page_snapshots, ler/gravar api_keys e
 * query_cache, mexer em qualquer coisa que o usuário não pode tocar.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ausentes no ambiente do servidor.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
