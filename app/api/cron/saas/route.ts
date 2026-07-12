import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/cron";
import { runSaasDiscovery } from "@/lib/providers/saas-discover";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Mineração SaaS. ?offset= &count= &paises=US,BR controlam o recorte, útil
 * pra semear em lotes (o feed classifica por palavra-chave). Protegido por
 * CRON_SECRET; disparável por agendador externo.
 */
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const offset = Number.parseInt(sp.get("offset") ?? "0", 10) || 0;
  const count = Number.parseInt(sp.get("count") ?? "12", 10) || 12;
  const paises = (sp.get("paises") ?? "US").split(",").filter(Boolean);

  const admin = createAdminClient();
  const resultado = await runSaasDiscovery(admin, { offset, count, paises });

  return NextResponse.json({ ok: true, offset, count, ...resultado });
}
