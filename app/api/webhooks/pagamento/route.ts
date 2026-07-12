import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Plano } from "@/lib/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ════════════════════════════════════════════════════════════════════════════
// MAPEAMENTO produto → plano. Preencha com os IDs/nomes reais dos seus produtos
// na Kiwify/Cakto. A chave é comparada (case-insensitive) com o id E o nome do
// produto que vier no payload.
// TODO: trocar pelos identificadores reais dos seus produtos.
// ════════════════════════════════════════════════════════════════════════════
const PRODUTO_PLANO: Record<string, Plano> = {
  "umbra-basico": "basico",
  "umbra-pro": "pro",
  "umbra-elite": "elite",
};

// Status que ATIVAM o plano vs. status que fazem downgrade para free.
const STATUS_ATIVA = ["paid", "approved", "aprovada", "completed", "active"];
const STATUS_CANCELA = [
  "refunded",
  "chargeback",
  "canceled",
  "cancelled",
  "cancelada",
  "refused",
  "expired",
];

/** POST — webhook Kiwify/Cakto. Valida token, mapeia produto→plano, atualiza. */
export async function POST(request: NextRequest) {
  // token pode vir por querystring (?token=) ou header
  const token =
    request.nextUrl.searchParams.get("token") ??
    request.headers.get("x-webhook-token") ??
    "";
  if (!process.env.PAGAMENTO_WEBHOOK_TOKEN || token !== process.env.PAGAMENTO_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) return NextResponse.json({ error: "Payload inválido." }, { status: 400 });

  const email = extrair(body, [
    "customer_email",
    ["customer", "email"],
    ["Customer", "email"],
    ["buyer", "email"],
    "email",
  ]);
  const produto = extrair(body, [
    "product_id",
    ["product", "id"],
    ["product", "name"],
    "product_name",
    "produto",
  ]);
  const status = (
    extrair(body, ["order_status", "status", ["order", "status"]]) ?? ""
  ).toLowerCase();

  if (!email) {
    // Acknowledge para o provedor não reenviar, mas registra o problema.
    return NextResponse.json({ ok: true, ignorado: "sem e-mail no payload" });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  const profileId = (profile as { id: string } | null)?.id;
  if (!profileId) {
    return NextResponse.json({ ok: true, ignorado: "usuário não encontrado" });
  }

  // decide o novo plano
  let novoPlano: Plano | null = null;
  let expira: string | null = null;

  if (STATUS_CANCELA.includes(status)) {
    novoPlano = "free";
  } else if (!status || STATUS_ATIVA.includes(status)) {
    novoPlano = mapProduto(produto);
    if (novoPlano) {
      // +31 dias a partir de agora (assinatura mensal)
      expira = new Date(Date.now() + 31 * 86400000).toISOString();
    }
  }

  if (!novoPlano) {
    return NextResponse.json({ ok: true, ignorado: `status '${status}' sem ação` });
  }

  await admin
    .from("profiles")
    .update({ plano: novoPlano, plano_expira_em: expira } as never)
    .eq("id", profileId);

  return NextResponse.json({ ok: true, plano: novoPlano });
}

function mapProduto(produto: string | null): Plano | null {
  if (!produto) return null;
  const p = produto.toLowerCase();
  for (const [chave, plano] of Object.entries(PRODUTO_PLANO)) {
    if (p === chave.toLowerCase() || p.includes(chave.toLowerCase())) return plano;
  }
  return null;
}

/** Extrai o primeiro caminho existente do payload (aceita chave ou [obj,chave]). */
function extrair(
  obj: Record<string, unknown>,
  caminhos: Array<string | [string, string]>,
): string | null {
  for (const c of caminhos) {
    if (typeof c === "string") {
      const v = obj[c];
      if (typeof v === "string" && v) return v;
    } else {
      const [a, b] = c;
      const sub = obj[a];
      if (sub && typeof sub === "object") {
        const v = (sub as Record<string, unknown>)[b];
        if (typeof v === "string" && v) return v;
      }
    }
  }
  return null;
}
