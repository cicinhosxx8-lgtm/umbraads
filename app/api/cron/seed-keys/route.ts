import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/cron";
import { seedApiKeys } from "@/lib/providers/api-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Semeia (idempotente) o pool api_keys a partir das chaves do ambiente
 * (RAPIDAPI_KEY_1..N) para as 3 APIs. Protegido pelo CRON_SECRET. Útil para
 * (re)carregar o pool após adicionar/rotacionar chaves na Vercel, sem esperar
 * o próximo ciclo de descoberta.
 */
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const resultado = await seedApiKeys(admin);

  const { count } = await admin
    .from("api_keys")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({ ok: true, ...resultado, total_no_pool: count ?? 0 });
}
