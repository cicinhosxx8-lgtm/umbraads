import { NextResponse, type NextRequest } from "next/server";

import { getCtx, apiError } from "@/lib/api";
import { LIMITES, PLANO_LABEL } from "@/lib/plano";
import { KeysEsgotadasError } from "@/lib/providers/key-manager";
import { searchAoVivo } from "@/lib/ads-live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Busca ao vivo (botão "Buscar ao vivo"). Vai direto na Ad Library pela
 * RapidAPI (rotação de chaves/APIs) e devolve os resultados SEM gravar no
 * Supabase — o app é 100% ao vivo. Só respeita o limite diário de buscas do
 * plano (isso continua no banco de perfis).
 */
export async function POST(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, user, plano } = ctx;

  const body = (await request.json().catch(() => ({}))) as {
    query?: string;
    pais?: string;
    ativo?: "active" | "inactive" | "all";
  };

  // 1) limite diário de buscas ------------------------------------------------
  const { data: profile } = await supabase
    .from("profiles")
    .select("buscas_hoje")
    .eq("id", user.id)
    .maybeSingle();
  const buscasHoje = (profile as { buscas_hoje: number } | null)?.buscas_hoje ?? 0;
  const limite = LIMITES.buscas[plano];
  if (Number.isFinite(limite) && buscasHoje >= limite) {
    return apiError(
      `Você bateu o limite de ${limite} buscas por dia do plano ${PLANO_LABEL[plano]}. Faça upgrade pra buscar sem limite.`,
      402,
      { limite, plano },
    );
  }
  await supabase
    .from("profiles")
    .update({ buscas_hoje: buscasHoje + 1 } as never)
    .eq("id", user.id);

  // 2) busca ao vivo ----------------------------------------------------------
  const query = (body.query ?? "").trim();
  const pais = (body.pais ?? "BR").toUpperCase();
  const ativo = body.ativo ?? "active";

  try {
    const ads = await searchAoVivo(query, pais, ativo);
    return NextResponse.json({
      ads: plano === "free" ? ads.slice(0, 4) : ads,
      fonte: "ao-vivo",
    });
  } catch (e) {
    if (e instanceof KeysEsgotadasError) {
      return apiError(
        "Nossas fontes de dados estão temporariamente no limite. Tente de novo em alguns minutos.",
        503,
      );
    }
    return apiError("Não foi possível buscar agora.", 502);
  }
}
