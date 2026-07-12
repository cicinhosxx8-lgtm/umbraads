import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Plano } from "@/lib/types/database";

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

export interface ApiCtx {
  supabase: ServerSupabase;
  user: User;
  plano: Plano;
}

/** Resposta JSON de erro padronizada. */
export function apiError(message: string, status: number, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/**
 * Garante sessão e devolve {supabase, user, plano}. Se não houver sessão,
 * retorna uma NextResponse 401 (o handler deve checar com `in`).
 */
export async function getCtx(): Promise<ApiCtx | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return apiError("Não autenticado.", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", user.id)
    .maybeSingle();

  const plano = ((profile as { plano: Plano } | null)?.plano ?? "free") as Plano;
  return { supabase, user, plano };
}
