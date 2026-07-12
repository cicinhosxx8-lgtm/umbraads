import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/cron";
import { runDiscovery } from "@/lib/providers/discover";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Descoberta de anúncios (BR + internacionais). Disparável manualmente ou por
 * um agendador externo (cron-job.org etc.) pra frequência maior que 1×/dia —
 * é útil no plano Hobby da Vercel, que limita crons nativos a 1×/dia.
 */
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const resultado = await runDiscovery(admin);

  const { count } = await admin
    .from("ads")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({ ok: true, ...resultado, total_no_banco: count ?? 0 });
}
