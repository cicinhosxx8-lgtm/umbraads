import type { Ad } from "@/lib/types/database";
import type { createClient } from "@/lib/supabase/server";
import { saasCategoriaByKey } from "@/lib/saas-categorias";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export const SAAS_PAGE_SIZE = 12;

interface CursorData {
  v: number;
  id: string;
}
function encodeCursor(d: CursorData): string {
  return Buffer.from(JSON.stringify(d), "utf8").toString("base64url");
}
function decodeCursor(s: string): CursorData | null {
  try {
    const d = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
    if (typeof d?.v === "number" && typeof d?.id === "string") return d;
  } catch {
    /* ignora */
  }
  return null;
}

export interface SaasResultado {
  ads: Ad[];
  nextCursor: string | null;
}

/**
 * Feed SaaS: anúncios cujo texto (nome da página ou copy) casa com as
 * palavras-chave da categoria. Ordena por Scale Score (keyset por cursor).
 */
export async function querySaas(
  supabase: ServerSupabase,
  categoriaKey: string,
  cursor?: string,
): Promise<SaasResultado> {
  const cat = saasCategoriaByKey(categoriaKey);
  if (!cat) return { ads: [], nextCursor: null };

  let query = supabase.from("ads").select("*").eq("ativo", true);

  // OR de ILIKE nas palavras da categoria (nome da página + copy)
  const termos = cat.filtro.slice(0, 18);
  const orParts: string[] = [];
  for (const t of termos) {
    const safe = t.replace(/[,()*]/g, " ").trim();
    if (safe) {
      orParts.push(`page_name.ilike.%${safe}%`);
      orParts.push(`copy_texto.ilike.%${safe}%`);
    }
  }
  if (orParts.length) query = query.or(orParts.join(","));

  // cursor keyset (scale_score desc, id asc como desempate)
  const cur = cursor ? decodeCursor(cursor) : null;
  if (cur) {
    query = query.or(
      `scale_score.lt.${cur.v},and(scale_score.eq.${cur.v},id.gt.${cur.id})`,
    );
  }

  query = query
    .order("scale_score", { ascending: false })
    .order("id", { ascending: true })
    .limit(SAAS_PAGE_SIZE + 1);

  const { data, error } = await query.returns<Ad[]>();
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > SAAS_PAGE_SIZE;
  const ads = hasMore ? rows.slice(0, SAAS_PAGE_SIZE) : rows;

  let nextCursor: string | null = null;
  if (hasMore && ads.length > 0) {
    const last = ads[ads.length - 1]!;
    nextCursor = encodeCursor({ v: last.scale_score, id: last.id });
  }

  return { ads, nextCursor };
}
