import { NextResponse, type NextRequest } from "next/server";

import { getCtx } from "@/lib/api";
import { querySaasLive } from "@/lib/ads-live";

const FREE_VISIVEL = 4;

/** Feed SaaS paginado por categoria. Free é capado no servidor (anti-bypass). */
export async function GET(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;

  const sp = request.nextUrl.searchParams;
  const categoria = sp.get("categoria") ?? "";
  const cursor = sp.get("cursor") ?? undefined;

  try {
    const resultado = await querySaasLive(categoria, cursor);
    if (ctx.plano === "free") {
      return NextResponse.json({
        ads: resultado.ads.slice(0, FREE_VISIVEL),
        nextCursor: null,
      });
    }
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar as ofertas SaaS." },
      { status: 500 },
    );
  }
}
