import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Ad, Database } from "@/lib/types/database";
import type { NormalizedAd } from "@/lib/providers/types";
import { computeScaleScore } from "@/lib/providers/scale-score";

type Admin = SupabaseClient<Database>;

/**
 * Upsert de UM anúncio ao vivo (feed sem banco) para dar integridade à FK
 * quando o usuário monitora a oferta. Insere por ad_archive_id (ignora o id
 * sintético do card) e devolve o uuid real da linha em `ads`.
 */
export async function upsertLiveAd(admin: Admin, ad: Ad): Promise<string | null> {
  if (!ad?.ad_archive_id || !ad?.page_id) return null;
  const payload = {
    ad_archive_id: ad.ad_archive_id,
    page_id: ad.page_id,
    page_name: ad.page_name,
    tipo_criativo: ad.tipo_criativo,
    copy_texto: ad.copy_texto,
    cta: ad.cta,
    link_destino: ad.link_destino,
    snapshot_url: ad.snapshot_url,
    pais: ad.pais,
    nicho: ad.nicho,
    idioma: ad.idioma,
    ativo: ad.ativo,
    data_inicio: ad.data_inicio,
    dias_ativo: ad.dias_ativo,
    variacoes_ativas: ad.variacoes_ativas,
    scale_score: ad.scale_score,
    ultima_verificacao: new Date().toISOString(),
  };
  await admin.from("ads").upsert(payload as never, { onConflict: "ad_archive_id" });
  const { data } = await admin
    .from("ads")
    .select("id")
    .eq("ad_archive_id", ad.ad_archive_id)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * Upsert dos anúncios normalizados (por ad_archive_id), recalculando o Scale
 * Score e preservando variacoes_7d_atras. Também faz upsert mínimo das páginas
 * (integridade das FKs de snapshots). Devolve os ids (uuid) dos ads.
 * Reutilizado pela busca (/api/search) e pelo cron de refresh.
 */
export async function upsertAds(
  admin: Admin,
  ads: NormalizedAd[],
): Promise<string[]> {
  if (ads.length === 0) return [];
  const archiveIds = ads.map((a) => a.ad_archive_id);

  const { data: existentes } = await admin
    .from("ads")
    .select("ad_archive_id, variacoes_7d_atras, nicho")
    .in("ad_archive_id", archiveIds)
    .returns<
      {
        ad_archive_id: string;
        variacoes_7d_atras: number | null;
        nicho: string | null;
      }[]
    >();
  const mapa = new Map(
    (existentes ?? []).map((e) => [
      e.ad_archive_id,
      { v7: e.variacoes_7d_atras, nicho: e.nicho },
    ]),
  );

  const pages = dedupePages(ads);
  if (pages.length) {
    await admin.from("pages").upsert(pages as never, { onConflict: "page_id" });
  }

  const payload = ads.map((a) => ({
    ad_archive_id: a.ad_archive_id,
    page_id: a.page_id,
    page_name: a.page_name,
    tipo_criativo: a.tipo_criativo,
    copy_texto: a.copy_texto,
    cta: a.cta,
    link_destino: a.link_destino,
    snapshot_url: a.snapshot_url,
    pais: a.pais,
    // preserva o nicho existente quando o provider não classifica (null)
    nicho: a.nicho ?? mapa.get(a.ad_archive_id)?.nicho ?? null,
    idioma: a.idioma,
    ativo: a.ativo,
    data_inicio: a.data_inicio,
    dias_ativo: a.dias_ativo,
    variacoes_ativas: a.variacoes_ativas,
    scale_score: computeScaleScore({
      variacoesAtivas: a.variacoes_ativas,
      variacoes7dAtras: mapa.get(a.ad_archive_id)?.v7 ?? null,
      diasAtivo: a.dias_ativo,
    }),
    ultima_verificacao: new Date().toISOString(),
  }));

  await admin.from("ads").upsert(payload as never, { onConflict: "ad_archive_id" });

  const { data } = await admin
    .from("ads")
    .select("id")
    .in("ad_archive_id", archiveIds)
    .returns<{ id: string }[]>();
  return (data ?? []).map((r) => r.id);
}

/** Grava (upsert) o snapshot do dia de anúncios ativos de uma página. */
export async function writePageSnapshot(
  admin: Admin,
  pageId: string,
  anunciosAtivos: number,
  data: string = new Date().toISOString().slice(0, 10),
): Promise<void> {
  await admin
    .from("page_snapshots")
    .upsert(
      { page_id: pageId, data, anuncios_ativos: anunciosAtivos } as never,
      { onConflict: "page_id,data" },
    );
}

function dedupePages(ads: NormalizedAd[]) {
  const seen = new Map<string, { page_id: string; nome: string | null }>();
  for (const a of ads) {
    if (!seen.has(a.page_id)) {
      seen.set(a.page_id, { page_id: a.page_id, nome: a.page_name });
    }
  }
  return [...seen.values()];
}
