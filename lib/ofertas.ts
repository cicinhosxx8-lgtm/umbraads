import type { Ad } from "@/lib/types/database";
import type { createClient } from "@/lib/supabase/server";

/** Tipo exato do client server (evita divergência de generics do supabase-js). */
type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/** Tamanho da página do feed. */
export const OFERTAS_PAGE_SIZE = 12;

export type OfertasSort = "score" | "recente" | "antigo";
export type OfertasStatus = "ativo" | "morto" | "todos";

export interface OfertasFiltros {
  q: string;
  nicho: string;
  pais: string;
  formato: string; // VIDEO | IMAGE | DCO | ""
  status: OfertasStatus;
  dias: number; // mínimo de dias no ar
  minVar: number; // mínimo de variações
  sort: OfertasSort;
  cursor: string;
}

// Formato do filtro (querystring) → valores de tipo_criativo no banco.
// A Meta usa vários rótulos; agrupamos por família pra não perder anúncios.
const FORMATO_DB: Record<string, string[]> = {
  video: ["VIDEO"],
  imagem: ["IMAGE", "MULTI_IMAGES"],
  carrossel: ["DCO", "CAROUSEL", "DPA"],
};

interface SortCfg {
  col: "scale_score" | "primeiro_visto" | "data_inicio";
  asc: boolean;
}

function sortCfg(sort: OfertasSort): SortCfg {
  switch (sort) {
    case "recente":
      return { col: "primeiro_visto", asc: false };
    case "antigo":
      return { col: "data_inicio", asc: true };
    default:
      return { col: "scale_score", asc: false };
  }
}

/** Lê os filtros de um URLSearchParams (ou objeto de searchParams). */
export function parseFiltros(
  sp: URLSearchParams | Record<string, string | string[] | undefined>,
): OfertasFiltros {
  const get = (k: string): string => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? "";
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };

  const statusRaw = get("status").toLowerCase();
  const status: OfertasStatus =
    statusRaw === "morto" || statusRaw === "todos"
      ? (statusRaw as OfertasStatus)
      : "ativo";

  const sortRaw = get("sort").toLowerCase();
  const sort: OfertasSort =
    sortRaw === "recente" || sortRaw === "antigo"
      ? (sortRaw as OfertasSort)
      : "score";

  return {
    q: get("q").trim(),
    nicho: get("nicho").trim(),
    pais: get("pais").trim(),
    formato: get("formato").trim().toLowerCase(),
    status,
    dias: Math.max(0, Number.parseInt(get("dias"), 10) || 0),
    minVar: Math.max(0, Number.parseInt(get("minVar"), 10) || 0),
    sort,
    cursor: get("cursor"),
  };
}

/** Serializa os filtros de volta para querystring (sem cursor). */
export function filtrosToQuery(f: Partial<OfertasFiltros>): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.nicho) p.set("nicho", f.nicho);
  if (f.pais) p.set("pais", f.pais);
  if (f.formato) p.set("formato", f.formato);
  if (f.status && f.status !== "ativo") p.set("status", f.status);
  if (f.dias) p.set("dias", String(f.dias));
  if (f.minVar) p.set("minVar", String(f.minVar));
  if (f.sort && f.sort !== "score") p.set("sort", f.sort);
  return p.toString();
}

// Cursor opaco (keyset): valor do campo de ordenação + id do último item.
interface CursorData {
  v: string | number;
  id: string;
}
function encodeCursor(d: CursorData): string {
  return Buffer.from(JSON.stringify(d), "utf8").toString("base64url");
}
function decodeCursor(s: string): CursorData | null {
  try {
    const d = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
    if (d && (typeof d.v === "string" || typeof d.v === "number") && typeof d.id === "string") {
      return d as CursorData;
    }
  } catch {
    /* cursor inválido → ignora */
  }
  return null;
}

export interface OfertasResultado {
  ads: Ad[];
  nextCursor: string | null;
}

/**
 * Consulta paginada do feed. Paginação por CURSOR (keyset) sobre o campo de
 * ordenação escolhido + id como desempate — estável mesmo com inserções.
 * Usada tanto pelo Server Component (/ofertas) quanto pela rota /api/ofertas.
 */
export async function queryOfertas(
  supabase: ServerSupabase,
  f: OfertasFiltros,
): Promise<OfertasResultado> {
  const { col, asc } = sortCfg(f.sort);

  let query = supabase.from("ads").select("*");

  // filtros
  if (f.q) {
    // Remove caracteres que quebrariam a sintaxe de filtro do PostgREST.
    const termo = f.q.replace(/[,()*]/g, " ").trim();
    if (termo) {
      const like = `%${termo}%`;
      query = query.or(
        `page_name.ilike.${like},copy_texto.ilike.${like},nicho.ilike.${like}`,
      );
    }
  }
  if (f.nicho) query = query.eq("nicho", f.nicho);
  if (f.pais) query = query.eq("pais", f.pais.toUpperCase());
  const formatoDb = f.formato ? FORMATO_DB[f.formato] : undefined;
  if (formatoDb && formatoDb.length) {
    query = query.in("tipo_criativo", formatoDb);
  }
  if (f.status === "ativo") query = query.eq("ativo", true);
  else if (f.status === "morto") query = query.eq("ativo", false);
  if (f.dias > 0) query = query.gte("dias_ativo", f.dias);
  if (f.minVar > 0) query = query.gte("variacoes_ativas", f.minVar);

  // cursor keyset
  const cur = f.cursor ? decodeCursor(f.cursor) : null;
  if (cur) {
    const op = asc ? "gt" : "lt";
    query = query.or(
      `${col}.${op}.${cur.v},and(${col}.eq.${cur.v},id.gt.${cur.id})`,
    );
  }

  // ordenação estável + 1 item extra para saber se há próxima página
  query = query
    .order(col, { ascending: asc, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(OFERTAS_PAGE_SIZE + 1);

  const { data, error } = await query.returns<Ad[]>();
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > OFERTAS_PAGE_SIZE;
  const ads = hasMore ? rows.slice(0, OFERTAS_PAGE_SIZE) : rows;

  let nextCursor: string | null = null;
  if (hasMore && ads.length > 0) {
    const last = ads[ads.length - 1]!;
    const v =
      col === "scale_score"
        ? last.scale_score
        : col === "primeiro_visto"
          ? last.primeiro_visto
          : (last.data_inicio ?? "");
    nextCursor = encodeCursor({ v, id: last.id });
  }

  return { ads, nextCursor };
}
