import { NextResponse, type NextRequest } from "next/server";

import { getCtx } from "@/lib/api";
import { parseFiltros } from "@/lib/ofertas";
import { queryOfertasLive } from "@/lib/ads-live";

const FREE_VISIVEL = 4;

/**
 * Feed paginado (lê do banco). Usado pelo "Carregar mais" do /ofertas.
 * Plano Free é capado no servidor (nunca recebe além dos 4 primeiros), então
 * a gate não pode ser burlada chamando a rota direto.
 */
export async function GET(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;

  const filtros = parseFiltros(request.nextUrl.searchParams);

  try {
    const resultado = await queryOfertasLive(filtros);
    if (ctx.plano === "free") {
      return NextResponse.json({
        ads: resultado.ads.slice(0, FREE_VISIVEL),
        nextCursor: null,
      });
    }
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar as ofertas." },
      { status: 500 },
    );
  }
}
