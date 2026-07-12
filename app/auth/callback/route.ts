import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Callback do OAuth (Google) e de links por e-mail (confirmação/reset).
 * O Supabase redireciona para cá com ?code=... — trocamos por uma sessão
 * (PKCE) e mandamos o usuário para `next` (ou /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Falhou a troca de code → volta pro login com aviso.
  return NextResponse.redirect(`${origin}/login?erro=auth`);
}
