import { NextResponse, type NextRequest } from "next/server";

import { getCtx, apiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertLiveAd } from "@/lib/providers/persist";
import { LIMITES, PLANO_LABEL } from "@/lib/plano";
import type { Ad, MonitoradoStatus } from "@/lib/types/database";

const STATUS_VALIDOS: MonitoradoStatus[] = ["observando", "validada", "morta"];

/** GET → lista os monitorados do usuário (com o anúncio). */
export async function GET() {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;

  const { data, error } = await ctx.supabase
    .from("monitorados")
    .select("*, ads(*)")
    .order("criado_em", { ascending: false });

  if (error) return apiError("Falha ao carregar monitorados.", 500);
  return NextResponse.json({ monitorados: data ?? [] });
}

/** POST { ad_id } → começa a monitorar (respeita o limite do plano). */
export async function POST(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, user, plano } = ctx;

  const body = (await request.json().catch(() => null)) as {
    ad_id?: string;
    ad?: Ad;
  } | null;
  let adId = body?.ad_id;
  if (!adId) return apiError("ad_id é obrigatório.", 400);

  // Feed ao vivo: o anúncio não está no banco. Se o card mandou o objeto do
  // anúncio, grava-o (só agora, porque o usuário escolheu monitorar) e usa o
  // uuid real da linha para a FK de monitorados.
  if (body?.ad?.ad_archive_id) {
    const realId = await upsertLiveAd(createAdminClient(), body.ad);
    if (realId) adId = realId;
    else return apiError("Não foi possível salvar o anúncio.", 500);
  }

  // Já monitora? Devolve o registro existente (idempotente).
  const { data: existente } = await supabase
    .from("monitorados")
    .select("*")
    .eq("ad_id", adId)
    .maybeSingle();
  if (existente) {
    return NextResponse.json({ monitorado: existente, jaExistia: true });
  }

  // Limite do plano.
  const limite = LIMITES.monitorados[plano];
  const { count } = await supabase
    .from("monitorados")
    .select("*", { count: "exact", head: true });
  if (Number.isFinite(limite) && (count ?? 0) >= limite) {
    return apiError(
      `Você atingiu o limite de ${limite} ofertas monitoradas do plano ${PLANO_LABEL[plano]}.`,
      402,
      { limite, plano },
    );
  }

  const { data, error } = await supabase
    .from("monitorados")
    .insert({ user_id: user.id, ad_id: adId } as never)
    .select("*")
    .single();

  if (error) return apiError("Não foi possível monitorar.", 500);
  return NextResponse.json({ monitorado: data });
}

/** PATCH { id, nota?, status? } → edita nota e/ou status. */
export async function PATCH(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    nota?: string;
    status?: string;
  } | null;
  if (!body?.id) return apiError("id é obrigatório.", 400);

  const patch: { nota?: string; status?: MonitoradoStatus } = {};
  if (typeof body.nota === "string") patch.nota = body.nota;
  if (body.status) {
    if (!STATUS_VALIDOS.includes(body.status as MonitoradoStatus)) {
      return apiError("status inválido.", 400);
    }
    patch.status = body.status as MonitoradoStatus;
  }
  if (Object.keys(patch).length === 0) {
    return apiError("Nada para atualizar.", 400);
  }

  const { data, error } = await ctx.supabase
    .from("monitorados")
    .update(patch as never)
    .eq("id", body.id)
    .select("*")
    .maybeSingle();

  if (error) return apiError("Não foi possível atualizar.", 500);
  if (!data) return apiError("Monitorado não encontrado.", 404);
  return NextResponse.json({ monitorado: data });
}

/** DELETE ?id= | { id } → para de monitorar. */
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

  const { error } = await ctx.supabase
    .from("monitorados")
    .delete()
    .eq("id", id);
  if (error) return apiError("Não foi possível remover.", 500);
  return NextResponse.json({ ok: true });
}
