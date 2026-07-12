import { cookies } from "next/headers";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";

/**
 * Client Supabase para Server Components / Route Handlers / Server Actions.
 * Respeita a sessão do usuário via cookies e obedece RLS (usa a anon key,
 * autenticada com o JWT do usuário logado).
 *
 * Em Server Components a escrita de cookies pode falhar (contexto read-only);
 * por isso os setters são envolvidos em try/catch — o refresh de sessão real
 * acontece no middleware.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado a partir de um Server Component sem resposta mutável.
            // O middleware já cuida de renovar a sessão.
          }
        },
      },
    },
  );
}
