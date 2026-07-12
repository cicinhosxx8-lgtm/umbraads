import { NextResponse, type NextRequest } from "next/server";

import { getCtx, apiError } from "@/lib/api";
import type { Alerta, AlertaTipo } from "@/lib/types/database";

const PAGE = 20;
const TIPOS: AlertaTipo[] = ["novo_anuncio", "explosao_variacoes", "oferta_morta"];

/** GET ?cursor=&tipo= → alertas paginados (mais recentes primeiro) + não lidos. */
export async function GET(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  const sp = request.nextUrl.searchParams;
  const tipo = sp.get("tipo") ?? "";
  const cursor = sp.get("cursor") ?? ""; // criado_em do último item

  let query = supabase
    .from("alertas")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(PAGE + 1);

  if (tipo && TIPOS.includes(tipo as AlertaTipo)) {
    query = query.eq("tipo", tipo);
  }
  if (cursor) query = query.lt("criado_em", cursor);

  const { data, error } = await query.returns<Alerta[]>();
  if (error) return apiError("Falha ao carregar alertas.", 500);

  const rows = data ?? [];
  const hasMore = rows.length > PAGE;
  const alertas = hasMore ? rows.slice(0, PAGE) : rows;
  const nextCursor =
    hasMore && alertas.length > 0
      ? alertas[alertas.length - 1]!.criado_em
      : null;

  // Total não lidos (para badge).
  const { count: naoLidos } = await supabase
    .from("alertas")
    .select("*", { count: "exact", head: true })
    .eq("lido", false);

  return NextResponse.json({ alertas, nextCursor, naoLidos: naoLidos ?? 0 });
}

/**
 * PATCH → marca como lido.
 *  { id }        marca um
 *  { ids: [] }   marca vários
 *  { all: true } marca todos
 */
export async function PATCH(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    ids?: string[];
    all?: boolean;
  } | null;

  let q = supabase.from("alertas").update({ lido: true } as never);
  if (body?.all) {
    q = q.eq("lido", false);
  } else if (Array.isArray(body?.ids) && body!.ids.length > 0) {
    q = q.in("id", body!.ids);
  } else if (body?.id) {
    q = q.eq("id", body.id);
  } else {
    return apiError("Informe id, ids ou all.", 400);
  }

  const { error } = await q;
  if (error) return apiError("Não foi possível marcar como lido.", 500);

  const { count: naoLidos } = await supabase
    .from("alertas")
    .select("*", { count: "exact", head: true })
    .eq("lido", false);

  return NextResponse.json({ ok: true, naoLidos: naoLidos ?? 0 });
}
