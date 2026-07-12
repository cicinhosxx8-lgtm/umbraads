import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { KIWIFY_PLANS, checkoutUrl, type PlanoPago } from "@/lib/kiwify";

export const dynamic = "force-dynamic";

/**
 * Redireciona para o checkout da Kiwify do plano escolhido.
 * Funciona logado (pré-preenche o e-mail) ou deslogado (o webhook cria a conta
 * pelo e-mail informado na Kiwify). Ex.: /api/checkout/pro
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { plano: string } },
) {
  const plano = params.plano as PlanoPago;
  if (!(plano in KIWIFY_PLANS)) {
    return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  }

  let email: string | null = null;
  if (supabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  }

  return NextResponse.redirect(checkoutUrl(plano, email));
}
