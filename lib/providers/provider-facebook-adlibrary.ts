import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type {
  AdProvider,
  NormalizedAd,
  SearchFiltros,
  SearchResultado,
} from "@/lib/providers/types";
import { KeyManager, fetchComChave } from "@/lib/providers/key-manager";

// ════════════════════════════════════════════════════════════════════════════
// CONFIG DA API — editar aqui se você trocar de API no RapidAPI.
// A validação (RAPIDAPI-INFORMAÇOES/scripts) apontou "facebook-scraper3".
// ════════════════════════════════════════════════════════════════════════════
const PROVEDOR = "facebook-scraper3";
const HOST = process.env.RAPIDAPI_HOST || "facebook-scraper3.p.rapidapi.com";
const BASE = `https://${HOST}`;

const ENDPOINTS = {
  // GET /ads/search  (query, country, active_status, cursor?) -> { ads[], cursor }
  search: "/ads/search",
  // GET /ads/details (ad_archive_id, page_id, country) -> { details }
  details: "/ads/details",
};

// Mapa: active status do UmbraAds -> param da API.
const ACTIVE_STATUS: Record<NonNullable<SearchFiltros["ativo"]>, string> = {
  active: "active",
  inactive: "inactive",
  all: "all",
};

// `ads` pode vir plano OU como array-de-arrays (grupos de collation) — achata.
function flatten(ads: unknown): RawAd[] {
  if (!Array.isArray(ads)) return [];
  return (Array.isArray(ads[0]) ? (ads as RawAd[][]).flat() : (ads as RawAd[]));
}

// Formato bruto (parcial) retornado pela API — ver scorecard facebook-scraper3.
interface RawAd {
  ad_archive_id?: string;
  page_id?: string;
  page_name?: string;
  is_active?: boolean;
  start_date?: number; // unix (segundos)
  collation_count?: number;
  targeted_or_reached_countries?: string[];
  snapshot?: {
    page_name?: string;
    display_format?: string;
    body?: { text?: string };
    cta_text?: string;
    cta_type?: string;
    link_url?: string;
    country_iso_code?: string;
    videos?: Array<{ video_hd_url?: string; video_sd_url?: string }>;
    images?: Array<{ original_image_url?: string }>;
  };
}

// ════════════════════════════════════════════════════════════════════════════
// MAPEAMENTO API -> NormalizedAd (rascunho aprovado no scorecard).
// ════════════════════════════════════════════════════════════════════════════
function normalize(ad: RawAd): NormalizedAd | null {
  if (!ad.ad_archive_id || !ad.page_id) return null;
  const snap = ad.snapshot ?? {};

  const dataInicio =
    typeof ad.start_date === "number"
      ? new Date(ad.start_date * 1000).toISOString().slice(0, 10)
      : null;
  const diasAtivo =
    typeof ad.start_date === "number"
      ? Math.max(
          0,
          Math.floor((Date.now() - ad.start_date * 1000) / 86_400_000),
        )
      : null;

  return {
    ad_archive_id: String(ad.ad_archive_id),
    page_id: String(ad.page_id),
    page_name: ad.page_name ?? snap.page_name ?? null,
    tipo_criativo: snap.display_format ?? null,
    copy_texto: snap.body?.text ?? null,
    cta: snap.cta_text ?? snap.cta_type ?? null,
    link_destino: snap.link_url ?? null,
    snapshot_url:
      snap.videos?.[0]?.video_hd_url ??
      snap.videos?.[0]?.video_sd_url ??
      snap.images?.[0]?.original_image_url ??
      null,
    pais: snap.country_iso_code ?? ad.targeted_or_reached_countries?.[0] ?? "BR",
    nicho: null, // a API não classifica nicho; fica a critério do produto
    idioma: null,
    ativo: ad.is_active ?? true,
    data_inicio: dataInicio,
    dias_ativo: diasAtivo,
    variacoes_ativas: ad.collation_count ?? 1,
  };
}

function extractAds(json: unknown): RawAd[] {
  const j = json as { ads?: unknown } | null;
  return flatten(j?.ads);
}
function extractCursor(json: unknown): string | null {
  const j = json as { cursor?: string } | null;
  return j?.cursor ?? null;
}

class FacebookAdLibraryProvider implements AdProvider {
  readonly nome = PROVEDOR;
  private km: KeyManager;

  constructor(admin: SupabaseClient<Database>) {
    this.km = new KeyManager(admin, PROVEDOR);
  }

  private async get(path: string, params: Record<string, string>): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetchComChave(this.km, HOST, `${BASE}${path}?${qs}`);
    if (!res.ok) throw new Error(`RapidAPI ${path} -> HTTP ${res.status}`);
    return res.json();
  }

  async searchAds(filtros: SearchFiltros): Promise<SearchResultado> {
    const country = filtros.pais ?? "BR";
    const json = await this.get(ENDPOINTS.search, {
      query: filtros.query ?? "",
      country,
      active_status: ACTIVE_STATUS[filtros.ativo ?? "active"],
      ...(filtros.cursor ? { cursor: filtros.cursor } : {}),
    });
    // A API costuma não trazer o país no anúncio → o país da BUSCA é a fonte
    // da verdade (o anúncio está sendo veiculado naquele país).
    const ads = extractAds(json)
      .map(normalize)
      .filter((a): a is NormalizedAd => a !== null)
      .map((a) => ({ ...a, pais: country }));
    return { ads, nextCursor: extractCursor(json) };
  }

  // scraper3 não filtra por page_id na busca — busca ampla e filtra no cliente.
  // TODO: se trocar por uma API com filtro por página, simplificar aqui.
  async getPageAds(pageId: string, cursor?: string): Promise<SearchResultado> {
    const json = await this.get(ENDPOINTS.search, {
      query: pageId,
      country: "BR",
      active_status: "all",
      ...(cursor ? { cursor } : {}),
    });
    const ads = extractAds(json)
      .map(normalize)
      .filter((a): a is NormalizedAd => a !== null && a.page_id === pageId);
    return { ads, nextCursor: extractCursor(json) };
  }

  async getAd(adArchiveId: string, pageId?: string): Promise<NormalizedAd | null> {
    const json = await this.get(ENDPOINTS.details, {
      ad_archive_id: adArchiveId,
      ...(pageId ? { page_id: pageId } : {}),
      country: "BR",
    });
    const details = (json as { details?: RawAd } | null)?.details;
    return details ? normalize(details) : null;
  }
}

/** Fábrica do provider principal (injeta o admin client p/ o key-manager). */
export function createFacebookProvider(
  admin: SupabaseClient<Database>,
): AdProvider {
  return new FacebookAdLibraryProvider(admin);
}
