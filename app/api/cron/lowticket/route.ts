import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/cron";
import { runLowTicketDiscovery } from "@/lib/providers/lowticket-discover";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Mineração Low Ticket. ?offset= &count= &paises=US,BR,DE,JP controlam o
 * recorte (o feed classifica por palavra-chave). Protegido por CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const offset = Number.parseInt(sp.get("offset") ?? "0", 10) || 0;
  const count = Number.parseInt(sp.get("count") ?? "10", 10) || 10;
  const paises = (sp.get("paises") ?? "US,BR,DE,JP").split(",").filter(Boolean);

  const admin = createAdminClient();
  const resultado = await runLowTicketDiscovery(admin, { offset, count, paises });

  return NextResponse.json({ ok: true, offset, count, ...resultado });
}
