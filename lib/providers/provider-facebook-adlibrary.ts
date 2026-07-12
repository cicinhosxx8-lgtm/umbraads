import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type {
  AdProvider,
  NormalizedAd,
  SearchFiltros,
  SearchResultado,
} from "@/lib/providers/types";
import { KeyManager, KeysEsgotadasError, fetchComChave } from "@/lib/providers/key-manager";
import { API_CONFIGS, type ApiConfig } from "@/lib/providers/api-config";

// ════════════════════════════════════════════════════════════════════════════
// Provider de Ad Library com ROTAÇÃO AUTOMÁTICA em duas camadas:
//   • KeyManager  → rotaciona as N chaves (RAPIDAPI_KEY_1..N) dentro de 1 API.
//   • MultiProvider → cascateia entre as 3 APIs (api4 → scraper3 → pages) quando
//     a cota de uma delas esgota (KeysEsgotadasError).
// As 3 APIs têm o MESMO formato de anúncio (mesmos caminhos no JSON), então um
// único normalize serve para todas — só muda o envelope da resposta.
// ════════════════════════════════════════════════════════════════════════════

const ACTIVE_STATUS: Record<NonNullable<SearchFiltros["ativo"]>, string> = {
  active: "active",
  inactive: "inactive",
  all: "all",
};

// Formato bruto (parcial) retornado pelas APIs — ver scorecards.
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

// ── Extractors robustos: aguentam os 3 envelopes possíveis ──────────────────
//   scraper3:  { ads: RawAd[], cursor }
//   api4/pages:{ data: { ads: RawAd[][], page_info: { end_cursor } } }
// `ads` pode vir plano OU como array-de-arrays (grupos de collation) — achata.
function flatten(ads: unknown): RawAd[] {
  if (!Array.isArray(ads)) return [];
  return Array.isArray(ads[0]) ? (ads as RawAd[][]).flat() : (ads as RawAd[]);
}

function extractAds(json: unknown): RawAd[] {
  const j = json as { ads?: unknown; data?: { ads?: unknown } } | null;
  const raw = j?.ads ?? j?.data?.ads;
  return flatten(raw);
}

function extractCursor(json: unknown): string | null {
  const j = json as
    | {
        cursor?: string;
        end_cursor?: string;
        page_info?: { end_cursor?: string };
        data?: { page_info?: { end_cursor?: string }; cursor?: string };
      }
    | null;
  return (
    j?.cursor ??
    j?.end_cursor ??
    j?.page_info?.end_cursor ??
    j?.data?.page_info?.end_cursor ??
    j?.data?.cursor ??
    null
  );
}

// ── MAPEAMENTO API → NormalizedAd (comum às 3 APIs) ─────────────────────────
function normalize(ad: RawAd): NormalizedAd | null {
  if (!ad.ad_archive_id || !ad.page_id) return null;
  const snap = ad.snapshot ?? {};

  const dataInicio =
    typeof ad.start_date === "number"
      ? new Date(ad.start_date * 1000).toISOString().slice(0, 10)
      : null;
  const diasAtivo =
    typeof ad.start_date === "number"
      ? Math.max(0, Math.floor((Date.now() - ad.start_date * 1000) / 86_400_000))
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

// ── Provider de UMA API (rotaciona as N chaves dessa API) ───────────────────
class SingleApiProvider implements AdProvider {
  readonly nome: string;
  private km: KeyManager;
  private base: string;

  constructor(
    admin: SupabaseClient<Database>,
    private readonly cfg: ApiConfig,
  ) {
    this.nome = cfg.provedor;
    this.km = new KeyManager(admin, cfg.provedor);
    this.base = `https://${cfg.host}`;
  }

  private async get(path: string, params: Record<string, string>): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    const res = await fetchComChave(this.km, this.cfg.host, `${this.base}${path}?${qs}`);
    if (!res.ok) throw new Error(`RapidAPI ${this.cfg.host}${path} -> HTTP ${res.status}`);
    return res.json();
  }

  async searchAds(filtros: SearchFiltros): Promise<SearchResultado> {
    const country = filtros.pais ?? "BR";
    const json = await this.get(this.cfg.searchPath, {
      query: filtros.query ?? "",
      country,
      active_status: ACTIVE_STATUS[filtros.ativo ?? "active"],
      ...(filtros.cursor ? { [this.cfg.cursorParam]: filtros.cursor } : {}),
    });
    // A API costuma não trazer o país no anúncio → o país da BUSCA é a fonte
    // da verdade (o anúncio está sendo veiculado naquele país).
    const ads = extractAds(json)
      .map(normalize)
      .filter((a): a is NormalizedAd => a !== null)
      .map((a) => ({ ...a, pais: country }));
    return { ads, nextCursor: extractCursor(json) };
  }

  // Busca ampla por page_id e filtra no cliente (as APIs não filtram por página
  // no endpoint de busca).
  async getPageAds(pageId: string, cursor?: string): Promise<SearchResultado> {
    const json = await this.get(this.cfg.searchPath, {
      query: pageId,
      country: "BR",
      active_status: "all",
      ...(cursor ? { [this.cfg.cursorParam]: cursor } : {}),
    });
    const ads = extractAds(json)
      .map(normalize)
      .filter((a): a is NormalizedAd => a !== null && a.page_id === pageId);
    return { ads, nextCursor: extractCursor(json) };
  }

  async getAd(adArchiveId: string, pageId?: string): Promise<NormalizedAd | null> {
    const json = await this.get(this.cfg.detailPath, {
      ad_archive_id: adArchiveId,
      ...(pageId ? { page_id: pageId } : {}),
      country: "BR",
    });
    const j = json as { details?: RawAd; data?: RawAd } | null;
    const details = j?.details ?? j?.data;
    return details ? normalize(details) : null;
  }
}

// ── MultiProvider: cascateia entre as 3 APIs por prioridade ─────────────────
class MultiProvider implements AdProvider {
  readonly nome = "facebook-adlibrary-multi";
  private providers: SingleApiProvider[];

  constructor(admin: SupabaseClient<Database>) {
    this.providers = API_CONFIGS.map((cfg) => new SingleApiProvider(admin, cfg));
  }

  /**
   * Tenta cada API em ordem de prioridade. Só cascateia quando a cota da API
   * atual esgota (KeysEsgotadasError) — um resultado vazio de uma API NÃO
   * dispara fallback (aquela keyword simplesmente não tem anúncios lá), para
   * não gastar a cota menor à toa. Se TODAS esgotarem, propaga o erro.
   */
  private async cascata<T>(
    op: (p: SingleApiProvider) => Promise<T>,
  ): Promise<T> {
    let ultimoErro: unknown = new KeysEsgotadasError("multi");
    for (const p of this.providers) {
      try {
        return await op(p);
      } catch (e) {
        if (e instanceof KeysEsgotadasError) {
          ultimoErro = e; // cota dessa API esgotou → tenta a próxima
          continue;
        }
        throw e; // erro real (rede/HTTP) → propaga
      }
    }
    throw ultimoErro;
  }

  searchAds(filtros: SearchFiltros): Promise<SearchResultado> {
    return this.cascata((p) => p.searchAds(filtros));
  }

  getPageAds(pageId: string, cursor?: string): Promise<SearchResultado> {
    return this.cascata((p) => p.getPageAds(pageId, cursor));
  }

  getAd(adArchiveId: string, pageId?: string): Promise<NormalizedAd | null> {
    return this.cascata((p) => p.getAd(adArchiveId, pageId));
  }
}

/**
 * Fábrica do provider principal. Devolve um MultiProvider que rotaciona as N
 * chaves × 3 APIs automaticamente. Todos os consumidores (busca, descoberta,
 * saas, lowticket) ganham a rotação sem mudar nada.
 */
export function createFacebookProvider(
  admin: SupabaseClient<Database>,
): AdProvider {
  return new MultiProvider(admin);
}
