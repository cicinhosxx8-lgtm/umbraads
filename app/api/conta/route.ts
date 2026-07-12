import { NextResponse } from "next/server";

import { getCtx, apiError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * DELETE → exclui a conta do usuário logado (e, por cascade, seus dados).
 * Usa a service role (admin) para remover o usuário do auth.
 */
export async function DELETE() {
  const ctx = await getCtx();
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, user } = ctx;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return apiError("Não foi possível excluir a conta.", 500);

  // encerra a sessão local
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
