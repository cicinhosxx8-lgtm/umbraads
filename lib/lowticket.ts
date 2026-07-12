import type { Ad } from "@/lib/types/database";
import type { createClient } from "@/lib/supabase/server";
import { lowticketCategoriaByKey } from "@/lib/lowticket-categorias";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export const LOWTICKET_PAGE_SIZE = 12;

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

export interface LowTicketResultado {
  ads: Ad[];
  nextCursor: string | null;
}

/**
 * Feed Low Ticket: anúncios cujo texto casa com as palavras (PT/EN/DE/JA) da
 * categoria. Ordena por Scale Score (keyset por cursor).
 */
export async function queryLowTicket(
  supabase: ServerSupabase,
  categoriaKey: string,
  cursor?: string,
): Promise<LowTicketResultado> {
  const cat = lowticketCategoriaByKey(categoriaKey);
  if (!cat) return { ads: [], nextCursor: null };

  let query = supabase.from("ads").select("*").eq("ativo", true);

  const termos = cat.filtro.slice(0, 20);
  const orParts: string[] = [];
  for (const t of termos) {
    const safe = t.replace(/[,()*]/g, " ").trim();
    if (safe) {
      orParts.push(`page_name.ilike.%${safe}%`);
      orParts.push(`copy_texto.ilike.%${safe}%`);
    }
  }
  if (orParts.length) query = query.or(orParts.join(","));

  const cur = cursor ? decodeCursor(cursor) : null;
  if (cur) {
    query = query.or(
      `scale_score.lt.${cur.v},and(scale_score.eq.${cur.v},id.gt.${cur.id})`,
    );
  }

  query = query
    .order("scale_score", { ascending: false })
    .order("id", { ascending: true })
    .limit(LOWTICKET_PAGE_SIZE + 1);

  const { data, error } = await query.returns<Ad[]>();
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > LOWTICKET_PAGE_SIZE;
  const ads = hasMore ? rows.slice(0, LOWTICKET_PAGE_SIZE) : rows;

  let nextCursor: string | null = null;
  if (hasMore && ads.length > 0) {
    const last = ads[ads.length - 1]!;
    nextCursor = encodeCursor({ v: last.scale_score, id: last.id });
  }

  return { ads, nextCursor };
}
