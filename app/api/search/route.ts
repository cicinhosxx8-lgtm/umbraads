import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getCtx, apiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { LIMITES, PLANO_LABEL } from "@/lib/plano";
import type { Ad } from "@/lib/types/database";
import { createFacebookProvider } from "@/lib/providers/provider-facebook-adlibrary";
import { KeysEsgotadasError } from "@/lib/providers/key-manager";
import { seedApiKeys } from "@/lib/providers/api-config";
import { upsertAds } from "@/lib/providers/persist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

/** Hash estável dos filtros normalizados (JSON com chaves ordenadas). */
function queryHash(obj: Record<string, string>): string {
  const ordenado = Object.keys(obj)
    .sort()
    .reduce<Record<string, string>>((acc, k) => {
      if (obj[k]) acc[k] = obj[k]!;
      return acc;
    }, {});
  return createHash("sha256").update(JSON.stringify(ordenado)).digest("hex");
}

/**
 * Busca ao vivo com cache.
 * 1) Checa/incrementa o limite diário de buscas do plano (402 se estourou).
 * 2) query_cache < 12h → devolve os ads do banco.
 * 3) senão → provider (com key-manager) → upsert ads → grava cache.
 */
export async function POST(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, user, plano } = ctx;

  const body = (await request.json().catch(() => ({}))) as {
    query?: string;
    pais?: string;
    ativo?: "active" | "inactive" | "all";
    cursor?: string;
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

  // filtros normalizados + hash ----------------------------------------------
  const filtros = {
    query: (body.query ?? "").trim().toLowerCase(),
    pais: (body.pais ?? "BR").toUpperCase(),
    ativo: body.ativo ?? "active",
    cursor: body.cursor ?? "",
  };
  const hash = queryHash(filtros);
  const admin = createAdminClient();

  // 2) cache -----------------------------------------------------------------
  const { data: cache } = await admin
    .from("query_cache")
    .select("ad_ids, atualizado_em")
    .eq("query_hash", hash)
    .maybeSingle();
  const cacheRow = cache as
    | { ad_ids: string[] | null; atualizado_em: string }
    | null;

  if (
    cacheRow?.ad_ids &&
    Date.now() - new Date(cacheRow.atualizado_em).getTime() < CACHE_TTL_MS
  ) {
    const { data } = await admin
      .from("ads")
      .select("*")
      .in("id", cacheRow.ad_ids)
      .order("scale_score", { ascending: false })
      .returns<Ad[]>();
    const rows = data ?? [];
    return NextResponse.json({
      ads: plano === "free" ? rows.slice(0, 4) : rows,
      fonte: "cache",
    });
  }

  // 3) provider --------------------------------------------------------------
  await seedApiKeys(admin); // garante o pool de chaves (env → api_keys)
  const provider = createFacebookProvider(admin);
  let resultado;
  try {
    resultado = await provider.searchAds({
      query: filtros.query,
      pais: filtros.pais,
      ativo: filtros.ativo,
      cursor: filtros.cursor || undefined,
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

  const ids = await upsertAds(admin, resultado.ads);

  await admin
    .from("query_cache")
    .upsert(
      {
        query_hash: hash,
        ad_ids: ids,
        atualizado_em: new Date().toISOString(),
      } as never,
      { onConflict: "query_hash" },
    );

  const { data } = await admin
    .from("ads")
    .select("*")
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
    .order("scale_score", { ascending: false })
    .returns<Ad[]>();
  const rows = data ?? [];

  return NextResponse.json({
    ads: plano === "free" ? rows.slice(0, 4) : rows,
    fonte: "provider",
    nextCursor: resultado.nextCursor,
  });
}
