import { NextResponse, type NextRequest } from "next/server";

import { getCtx, apiError } from "@/lib/api";
import { LIMITES, PLANO_LABEL } from "@/lib/plano";
import type { RastreadoTipo } from "@/lib/types/database";

/** GET → lista os rastreios do usuário. */
export async function GET() {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;

  const { data, error } = await ctx.supabase
    .from("rastreados")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) return apiError("Falha ao carregar rastreios.", 500);
  return NextResponse.json({ rastreados: data ?? [] });
}

/** POST { tipo, valor } → cria um rastreio (respeita o limite do plano). */
export async function POST(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, user, plano } = ctx;

  const body = (await request.json().catch(() => null)) as {
    tipo?: string;
    valor?: string;
  } | null;

  const tipo = body?.tipo === "keyword" ? "keyword" : "pagina";
  const valor = (body?.valor ?? "").trim();
  if (!valor) return apiError("Informe a página ou palavra-chave.", 400);

  // Já rastreia esse valor? (idempotente)
  const { data: existente } = await supabase
    .from("rastreados")
    .select("*")
    .eq("tipo", tipo)
    .eq("valor", valor)
    .maybeSingle();
  if (existente) {
    return NextResponse.json({ rastreado: existente, jaExistia: true });
  }

  // Limite do plano (conta só os ATIVOS).
  const limite = LIMITES.rastreados[plano];
  if (limite <= 0) {
    return apiError(
      `O plano ${PLANO_LABEL[plano]} não inclui rastreios. Faça upgrade para vigiar páginas e keywords.`,
      402,
      { limite, plano },
    );
  }
  const { count } = await supabase
    .from("rastreados")
    .select("*", { count: "exact", head: true })
    .eq("ativo", true);
  if (Number.isFinite(limite) && (count ?? 0) >= limite) {
    return apiError(
      `Você atingiu o limite de ${limite} rastreios do plano ${PLANO_LABEL[plano]}.`,
      402,
      { limite, plano },
    );
  }

  const { data, error } = await supabase
    .from("rastreados")
    .insert({ user_id: user.id, tipo: tipo as RastreadoTipo, valor } as never)
    .select("*")
    .single();

  if (error) return apiError("Não foi possível criar o rastreio.", 500);
  return NextResponse.json({ rastreado: data });
}

/** PATCH { id, ativo } → liga/desliga o rastreio. */
export async function PATCH(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, plano } = ctx;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    ativo?: boolean;
  } | null;
  if (!body?.id || typeof body.ativo !== "boolean") {
    return apiError("id e ativo são obrigatórios.", 400);
  }

  // Ao reativar, respeita o limite do plano.
  if (body.ativo) {
    const limite = LIMITES.rastreados[plano];
    const { count } = await supabase
      .from("rastreados")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true);
    if (Number.isFinite(limite) && (count ?? 0) >= limite) {
      return apiError(
        `Limite de ${limite} rastreios ativos atingido no plano ${PLANO_LABEL[plano]}.`,
        402,
        { limite, plano },
      );
    }
  }

  const { data, error } = await supabase
    .from("rastreados")
    .update({ ativo: body.ativo } as never)
    .eq("id", body.id)
    .select("*")
    .maybeSingle();

  if (error) return apiError("Não foi possível atualizar.", 500);
  if (!data) return apiError("Rastreio não encontrado.", 404);
  return NextResponse.json({ rastreado: data });
}

/** DELETE ?id= | { id } → remove o rastreio. */
export async function DELETE(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(request.url);
  let id = url.searchParams.get("id") ?? "";
  if (!id) {
    const body = (await request.json().catch(() => null)) as {
      id?: string;
    } | null;
    id = body?.id ?? "";
  }
  if (!id) return apiError("id é obrigatório.", 400);

  const { error } = await ctx.supabase.from("rastreados").delete().eq("id", id);
  if (error) return apiError("Não foi possível remover.", 500);
  return NextResponse.json({ ok: true });
}
