import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Plano } from "@/lib/types/database";
import {
  mapEvento,
  planoByCheckoutLink,
  validateKiwifySignature,
} from "@/lib/kiwify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Webhook da Kiwify (formato REAL). Valida a assinatura (HMAC-SHA1 no
 * ?signature=), identifica o plano pelo checkout_link, e ativa/desativa o
 * plano do usuário (criando a conta pelo e-mail se ele comprou antes de se
 * cadastrar).
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.nextUrl.searchParams.get("signature");

  // 1) validação: assinatura HMAC-SHA1 OU (fallback de teste) token no corpo
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  const tokenNoCorpo =
    (body.token as string) ?? (body.secret as string) ?? null;
  const assinaturaOk = validateKiwifySignature(raw, signature);
  const tokenOk = !!secret && tokenNoCorpo === secret;
  if (!assinaturaOk && !tokenOk) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  // 2) normaliza (suporta o payload real e o formato de teste interno)
  const data = (body.data as Record<string, unknown>) ?? body;
  const email = extrair(body, data, [
    ["Customer", "email"],
    ["customer", "email"],
    "customer_email",
    "email",
  ]);
  const checkoutLink =
    (body.checkout_link as string) ??
    (get(data, ["product", "id"]) as string) ??
    null;
  const tipoEvento =
    (body.webhook_event_type as string) ??
    (body.event as string) ??
    (body.order_status as string) ??
    null;
  const orderId =
    (body.order_id as string) ?? (get(data, ["id"]) as string) ?? "";

  const evento = mapEvento(tipoEvento);
  if (!evento) {
    return NextResponse.json({ ok: true, ignorado: `evento '${tipoEvento}'` });
  }
  if (!email) {
    return NextResponse.json({ ok: true, ignorado: "sem e-mail no payload" });
  }
  // e-mails de teste não tocam o banco
  if (/example\.com|john\.doe/i.test(email)) {
    return NextResponse.json({ ok: true, teste: true });
  }

  const admin = createAdminClient();
  const userId = await acharOuCriarUser(admin, email);
  if (!userId) {
    return NextResponse.json({ ok: true, ignorado: "usuário não resolvido" });
  }

  if (evento === "approved") {
    const plano = planoByCheckoutLink(checkoutLink);
    if (!plano) {
      return NextResponse.json({
        ok: true,
        ignorado: `checkout_link '${checkoutLink}' não mapeado`,
      });
    }
    const nextPayment = get(data, ["Subscription", "next_payment"]) as string | undefined;
    const expira =
      (typeof nextPayment === "string" && nextPayment) ||
      new Date(Date.now() + 31 * 86400000).toISOString();

    await admin
      .from("profiles")
      .update({ plano, plano_expira_em: expira } as never)
      .eq("id", userId);
    return NextResponse.json({ ok: true, plano, order_id: orderId });
  }

  // refund / cancelled → volta pro free
  await admin
    .from("profiles")
    .update({ plano: "free" as Plano, plano_expira_em: null } as never)
    .eq("id", userId);
  return NextResponse.json({ ok: true, plano: "free", order_id: orderId });
}

/** Acha o profile pelo e-mail; se não existir, cria a conta (compra pré-cadastro). */
async function acharOuCriarUser(
  admin: Admin,
  email: string,
): Promise<string | null> {
  const { data: prof } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  const existente = (prof as { id: string } | null)?.id;
  if (existente) return existente;

  const { data: created } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  const novoId = created?.user?.id;
  if (novoId) {
    // o trigger cria o profile; upsert por segurança
    await admin
      .from("profiles")
      .upsert({ id: novoId, email } as never, { onConflict: "id" });
    return novoId;
  }
  return null;
}

function get(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return cur;
}

function extrair(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  caminhos: Array<string | [string, string]>,
): string | null {
  for (const src of [a, b]) {
    for (const c of caminhos) {
      const v = typeof c === "string" ? src[c] : get(src, c);
      if (typeof v === "string" && v) return v;
    }
  }
  return null;
}
