import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/cron";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Zera buscas_hoje de todos os perfis (roda 00:00 UTC via Vercel Cron). */
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ buscas_hoje: 0 } as never)
    .gt("buscas_hoje", 0);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
