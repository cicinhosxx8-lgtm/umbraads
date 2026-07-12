import { NextResponse, type NextRequest } from "next/server";

import { getCtx, apiError } from "@/lib/api";
import type { Ad, PageSnapshot } from "@/lib/types/database";

/** GET → detalhe do anúncio + snapshots da página + outros anúncios da página. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  const { data: adData } = await supabase
    .from("ads")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  const ad = adData as Ad | null;
  if (!ad) return apiError("Anúncio não encontrado.", 404);

  const [{ data: snapshots }, { data: maisAds }] = await Promise.all([
    supabase
      .from("page_snapshots")
      .select("*")
      .eq("page_id", ad.page_id)
      .order("data", { ascending: true })
      .returns<PageSnapshot[]>(),
    supabase
      .from("ads")
      .select("*")
      .eq("page_id", ad.page_id)
      .neq("id", ad.id)
      .order("scale_score", { ascending: false })
      .limit(8)
      .returns<Ad[]>(),
  ]);

  return NextResponse.json({
    ad,
    snapshots: snapshots ?? [],
    maisDaPagina: maisAds ?? [],
  });
}
