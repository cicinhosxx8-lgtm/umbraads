import "server-only";

import { unstable_cache } from "next/cache";

import type { Ad } from "@/lib/types/database";
import type { NormalizedAd } from "@/lib/providers/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createFacebookProvider } from "@/lib/providers/provider-facebook-adlibrary";
import { seedApiKeys } from "@/lib/providers/api-config";
import { KeysEsgotadasError } from "@/lib/providers/key-manager";
import { computeScaleScore } from "@/lib/providers/scale-score";
import { saasCategoriaByKey } from "@/lib/saas-categorias";
import { lowticketCategoriaByKey } from "@/lib/lowticket-categorias";
import type { OfertasFiltros } from "@/lib/ofertas";

// ════════════════════════════════════════════════════════════════════════════
// FEED AO VIVO — anúncios vêm direto da RapidAPI, SEM gravar no Supabase.
// Um cache curto (unstable_cache, 30 min) guarda o "lote" na Vercel: vários
// visitantes veem o mesmo lote no intervalo, então a cota das APIs não queima a
// cada clique. A cada expiração, um novo lote (keywords aleatórias) é buscado.
// ════════════════════════════════════════════════════════════════════════════

const REVALIDATE = 1800; // 30 min
const BUSCAS_POR_LOTE = 4; // nº de buscas (keyword×país) por atualização do lote
const LOTE_MAX = 60; // teto de anúncios por lote

export const PAGE_SIZE = 12;

// Índice em memória (por instância, quente) de todo anúncio que já passou por
// algum feed — para a página de detalhe achar o anúncio pelo id sem depender de
// qual feed (Ofertas/SaaS/Low Ticket) ele veio. Best-effort; se a instância for
// fria, o detalhe cai no fallback ao vivo (getPageAds/getAd).
const adIndex = new Map<string, Ad>();
function indexAds(ads: Ad[]): void {
  if (adIndex.size > 8000) adIndex.clear(); // teto simples anti-vazamento
  for (const a of ads) adIndex.set(a.id, a);
}

type Combo = [country: string, query: string, nicho: string];

// keywords por idioma (a API não classifica nicho — usamos a keyword)
const PT: Array<[string, string]> = [
  ["fritadeira", "achadinhos"],
  ["air fryer", "casa & cozinha"],
  ["organizador de casa", "casa & cozinha"],
  ["emagrecedor", "beleza"],
  ["sérum facial", "beleza"],
  ["tapete higiênico pet", "pet"],
  ["ração cachorro", "pet"],
  ["renda extra", "renda extra"],
  ["ganhar dinheiro online", "renda extra"],
  ["achadinhos", "achadinhos"],
];
const EN: Array<[string, string]> = [
  ["air fryer", "casa & cozinha"],
  ["weight loss", "beleza"],
  ["skincare", "beleza"],
  ["make money online", "renda extra"],
  ["dog toys", "pet"],
  ["home gadgets", "achadinhos"],
  ["kitchen gadgets", "casa & cozinha"],
  ["fitness", "beleza"],
];
const ES: Array<[string, string]> = [
  ["freidora de aire", "casa & cozinha"],
  ["adelgazar", "beleza"],
  ["ganar dinero", "renda extra"],
  ["juguetes para perros", "pet"],
];

const MATRIZ: Array<{ country: string; queries: Array<[string, string]> }> = [
  { country: "BR", queries: PT },
  { country: "US", queries: EN },
  { country: "GB", queries: EN },
  { country: "PT", queries: PT },
  { country: "ES", queries: ES },
  { country: "MX", queries: ES },
];

const COMBOS_FEED: Combo[] = MATRIZ.flatMap((m) =>
  m.queries.map(([q, n]) => [m.country, q, n] as Combo),
);

/** Embaralha (Fisher–Yates) e devolve os primeiros `n`. */
function amostra<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a.slice(0, n);
}

/** NormalizedAd (provider) → Ad (shape do banco), com id sintético estável. */
function toAd(n: NormalizedAd): Ad {
  const nowIso = new Date().toISOString();
  return {
    id: n.ad_archive_id, // id sintético = ad_archive_id (estável entre lotes)
    ad_archive_id: n.ad_archive_id,
    page_id: n.page_id,
    page_name: n.page_name,
    tipo_criativo: n.tipo_criativo,
    copy_texto: n.copy_texto,
    cta: n.cta,
    link_destino: n.link_destino,
    snapshot_url: n.snapshot_url,
    pais: n.pais,
    nicho: n.nicho,
    idioma: n.idioma,
    ativo: n.ativo,
    data_inicio: n.data_inicio,
    dias_ativo: n.dias_ativo,
    variacoes_ativas: n.variacoes_ativas,
    variacoes_7d_atras: null,
    scale_score: computeScaleScore({
      variacoesAtivas: n.variacoes_ativas,
      variacoes7dAtras: null,
      diasAtivo: n.dias_ativo,
    }),
    primeiro_visto: n.data_inicio ? `${n.data_inicio}T00:00:00.000Z` : nowIso,
    ultima_verificacao: nowIso,
  };
}

/**
 * Busca (SEM cache) um lote de anúncios ao vivo para os combos dados. Só
 * mantém anúncios COM criativo. Rotaciona chaves/APIs pelo provider. Erro
 * pontual não derruba o lote; se a cota esgotar, devolve o que tiver.
 */
async function fetchLote(combos: Combo[]): Promise<Ad[]> {
  const admin = createAdminClient();
  await seedApiKeys(admin);
  const provider = createFacebookProvider(admin);
  const out = new Map<string, Ad>();

  for (const [country, query, nicho] of combos) {
    if (out.size >= LOTE_MAX) break;
    try {
      const { ads } = await provider.searchAds({
        query,
        pais: country,
        ativo: "active",
      });
      for (const a of ads) {
        if (!a.snapshot_url) continue; // só entra com criativo
        a.nicho = a.nicho ?? nicho;
        const ad = toAd(a);
        if (!out.has(ad.id)) out.set(ad.id, ad);
      }
    } catch (e) {
      if (e instanceof KeysEsgotadasError) break;
      // erro pontual de uma keyword não derruba o lote
    }
  }

  return [...out.values()].sort((a, b) => b.scale_score - a.scale_score);
}

// ── Lotes com cache (30 min) ────────────────────────────────────────────────

/** Lote do feed principal (keywords aleatórias, mix de países). */
const loteFeed = unstable_cache(
  async () => fetchLote(amostra(COMBOS_FEED, BUSCAS_POR_LOTE)),
  ["ads-live", "feed"],
  { revalidate: REVALIDATE, tags: ["ads-live"] },
);

/** Lote de uma categoria SaaS (termos da categoria em US + BR). */
function loteSaas(key: string) {
  return unstable_cache(
    async () => {
      const cat = saasCategoriaByKey(key);
      if (!cat) return [] as Ad[];
      const termos = amostra(cat.busca, 2);
      const combos: Combo[] = termos.flatMap((t) => [
        ["US", t, "saas"] as Combo,
        ["BR", t, "saas"] as Combo,
      ]);
      return fetchLote(combos);
    },
    ["ads-live", "saas", key],
    { revalidate: REVALIDATE, tags: ["ads-live"] },
  )();
}

/** Lote de uma categoria Low Ticket (termos por país da categoria). */
function loteLowTicket(key: string) {
  return unstable_cache(
    async () => {
      const cat = lowticketCategoriaByKey(key);
      if (!cat) return [] as Ad[];
      const combos: Combo[] = [];
      for (const [pais, termos] of Object.entries(cat.buscaPorPais)) {
        const t = amostra(termos, 1)[0];
        if (t) combos.push([pais, t, "lowticket"]);
      }
      return fetchLote(amostra(combos, BUSCAS_POR_LOTE));
    },
    ["ads-live", "lowticket", key],
    { revalidate: REVALIDATE, tags: ["ads-live"] },
  )();
}

// ── Cursor de paginação (offset simples, base64) ────────────────────────────
function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset }), "utf8").toString("base64url");
}
function decodeCursor(s: string): number {
  try {
    const d = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
    if (typeof d?.o === "number" && d.o >= 0) return d.o;
  } catch {
    /* cursor inválido → começo */
  }
  return 0;
}

function paginar(ads: Ad[], cursor?: string): { ads: Ad[]; nextCursor: string | null } {
  const offset = cursor ? decodeCursor(cursor) : 0;
  const slice = ads.slice(offset, offset + PAGE_SIZE);
  const next = offset + PAGE_SIZE < ads.length ? encodeCursor(offset + PAGE_SIZE) : null;
  return { ads: slice, nextCursor: next };
}

// Mapa do filtro de formato → valores de tipo_criativo (espelha lib/ofertas).
const FORMATO_DB: Record<string, string[]> = {
  video: ["VIDEO"],
  imagem: ["IMAGE", "MULTI_IMAGES"],
  carrossel: ["DCO", "CAROUSEL", "DPA"],
};

/** Aplica os filtros do feed em memória sobre o lote. */
function aplicarFiltros(ads: Ad[], f: OfertasFiltros): Ad[] {
  let r = ads;
  if (f.q) {
    const t = f.q.toLowerCase();
    r = r.filter(
      (a) =>
        (a.page_name ?? "").toLowerCase().includes(t) ||
        (a.copy_texto ?? "").toLowerCase().includes(t) ||
        (a.nicho ?? "").toLowerCase().includes(t),
    );
  }
  if (f.nicho) r = r.filter((a) => a.nicho === f.nicho);
  if (f.pais) r = r.filter((a) => a.pais === f.pais.toUpperCase());
  const fmt = f.formato ? FORMATO_DB[f.formato] : undefined;
  if (fmt && fmt.length) {
    r = r.filter((a) => fmt.includes((a.tipo_criativo ?? "").toUpperCase()));
  }
  if (f.status === "morto") r = r.filter((a) => !a.ativo);
  else if (f.status === "ativo") r = r.filter((a) => a.ativo);
  if (f.dias > 0) r = r.filter((a) => (a.dias_ativo ?? 0) >= f.dias);
  if (f.minVar > 0) r = r.filter((a) => a.variacoes_ativas >= f.minVar);

  if (f.sort === "recente") {
    r = [...r].sort((a, b) => (b.data_inicio ?? "").localeCompare(a.data_inicio ?? ""));
  } else if (f.sort === "antigo") {
    r = [...r].sort((a, b) => (a.data_inicio ?? "").localeCompare(b.data_inicio ?? ""));
  } // "score" já vem ordenado do lote
  return r;
}

// ── API pública ─────────────────────────────────────────────────────────────

/** Feed Ofertas ao vivo, com filtros + paginação (mesma interface de queryOfertas). */
export async function queryOfertasLive(
  f: OfertasFiltros,
): Promise<{ ads: Ad[]; nextCursor: string | null }> {
  const lote = await loteFeed();
  indexAds(lote);
  return paginar(aplicarFiltros(lote, f), f.cursor || undefined);
}

/** Feed SaaS ao vivo (por categoria). */
export async function querySaasLive(
  key: string,
  cursor?: string,
): Promise<{ ads: Ad[]; nextCursor: string | null }> {
  const lote = await loteSaas(key);
  indexAds(lote);
  return paginar(lote, cursor);
}

/** Feed Low Ticket ao vivo (por categoria). */
export async function queryLowTicketLive(
  key: string,
  cursor?: string,
): Promise<{ ads: Ad[]; nextCursor: string | null }> {
  const lote = await loteLowTicket(key);
  indexAds(lote);
  return paginar(lote, cursor);
}

/** Lote completo do feed em cache (usado pelo dashboard p/ top + contadores). */
export async function feedLote(): Promise<Ad[]> {
  const lote = await loteFeed();
  indexAds(lote);
  return lote;
}

/** Top N do feed (usado pelo dashboard). */
export async function topOfertasLive(n: number): Promise<Ad[]> {
  const lote = await loteFeed();
  indexAds(lote);
  return lote.slice(0, n);
}

/**
 * Busca 1 anúncio ao vivo pelo id (= ad_archive_id). Primeiro tenta o lote em
 * cache (0 chamadas); se não achar e houver page_id, busca o detalhe na API.
 * Cacheado por 30 min por (id,pageId).
 */
export async function getLiveAd(id: string, pageId?: string): Promise<Ad | null> {
  // 1) índice em memória (qualquer feed já visto nesta instância) — 0 chamadas.
  const doIndice = adIndex.get(id);
  if (doIndice) return doIndice;
  // 2) lote principal em cache.
  const noLote = (await loteFeed()).find((a) => a.id === id);
  if (noLote) return noLote;
  if (!pageId) return null;

  // 3) instância fria: busca ao vivo (cacheada por id+pageId). Tenta a LISTA da
  // página (endpoint de busca, mais confiável) e depois o endpoint de detalhe.
  return unstable_cache(
    async () => {
      const admin = createAdminClient();
      await seedApiKeys(admin);
      const provider = createFacebookProvider(admin);

      try {
        const { ads } = await provider.getPageAds(pageId);
        const exato = ads.find((a) => a.ad_archive_id === id);
        if (exato) return toAd(exato);
      } catch {
        /* segue pro detalhe */
      }

      try {
        const n = await provider.getAd(id, pageId);
        if (n) return toAd({ ...n, ad_archive_id: id, page_id: pageId });
      } catch {
        /* sem sorte */
      }

      return null;
    },
    ["ads-live", "detail", id, pageId],
    { revalidate: REVALIDATE, tags: ["ads-live"] },
  )();
}

/**
 * Busca ao vivo (SEM cache) para o botão "Buscar ao vivo" — o usuário digitou
 * uma keyword específica e quer resultado fresco. Não grava nada no banco.
 * Propaga KeysEsgotadasError para a rota devolver 503.
 */
export async function searchAoVivo(
  query: string,
  pais: string,
  ativo: "active" | "inactive" | "all" = "active",
): Promise<Ad[]> {
  const admin = createAdminClient();
  await seedApiKeys(admin);
  const provider = createFacebookProvider(admin);
  const { ads } = await provider.searchAds({ query, pais, ativo });
  const mapped = ads.filter((a) => a.snapshot_url).map(toAd);
  indexAds(mapped);
  return mapped;
}

/** "Mais anúncios da mesma página" a partir do lote em cache (0 chamadas extra). */
export async function maisDaPaginaLive(
  pageId: string,
  exceptId: string,
  limite = 8,
): Promise<Ad[]> {
  const lote = await loteFeed();
  return lote.filter((a) => a.page_id === pageId && a.id !== exceptId).slice(0, limite);
}
