import { NextResponse, type NextRequest } from "next/server";

import { getCtx, apiError } from "@/lib/api";
import type { Preferencias } from "@/lib/types/database";

export const dynamic = "force-dynamic";

/** PATCH { pais_padrao?, nichos? } → mescla nas preferências do usuário. */
export async function PATCH(request: NextRequest) {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, user } = ctx;

  const body = (await request.json().catch(() => null)) as Partial<Preferencias> | null;
  if (!body) return apiError("Payload inválido.", 400);

  const { data: atual } = await supabase
    .from("profiles")
    .select("preferencias")
    .eq("id", user.id)
    .maybeSingle();

  const prefsAtuais =
    (atual as { preferencias: Preferencias } | null)?.preferencias ?? {};
  const merged: Preferencias = { ...prefsAtuais };
  if (typeof body.pais_padrao === "string") merged.pais_padrao = body.pais_padrao;
  if (Array.isArray(body.nichos)) merged.nichos = body.nichos;

  const { error } = await supabase
    .from("profiles")
    .update({ preferencias: merged } as never)
    .eq("id", user.id);

  if (error) return apiError("Não foi possível salvar.", 500);
  return NextResponse.json({ preferencias: merged });
}
