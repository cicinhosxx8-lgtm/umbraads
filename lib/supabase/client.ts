import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

/**
 * Client Supabase para Client Components (roda no browser).
 * Usa apenas as chaves PÚBLICAS (URL + anon key). Nunca importar a
 * service role aqui — ela vive só no servidor (ver lib/supabase/admin.ts).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
