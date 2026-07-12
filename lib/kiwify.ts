import { createHmac, timingSafeEqual } from "node:crypto";

import type { Plano } from "@/lib/types/database";

/**
 * Integração Kiwify — planos, checkout e validação de webhook.
 * IDs (checkout_link short) e preços do painel Kiwify do UmbraAds.
 * O checkout_link é o ID curto da URL (pay.kiwify.com.br/<id>) — é ele que
 * vem no webhook, NÃO o Product.product_id (UUID interno não mapeável).
 */
export type PlanoPago = "basico" | "pro" | "elite";

export interface KiwifyPlano {
  id: string; // checkout_link short ID
  nome: string;
  preco: number; // R$
  plano: PlanoPago;
}

export const KIWIFY_PLANS: Record<PlanoPago, KiwifyPlano> = {
  basico: {
    id: process.env.KIWIFY_PRODUCT_ID_BASICO || "fnJ6e8P",
    nome: "Básico",
    preco: 47,
    plano: "basico",
  },
  pro: {
    id: process.env.KIWIFY_PRODUCT_ID_PRO || "0FTOD9I",
    nome: "Pro",
    preco: 97,
    plano: "pro",
  },
  elite: {
    id: process.env.KIWIFY_PRODUCT_ID_ELITE || "L0PUomP",
    nome: "Elite",
    preco: 147,
    plano: "elite",
  },
};

const CHECKOUT_BASE = "https://pay.kiwify.com.br";

/** URL de checkout da Kiwify, com e-mail pré-preenchido quando disponível. */
export function checkoutUrl(plano: PlanoPago, email?: string | null): string {
  const p = KIWIFY_PLANS[plano];
  const q = email ? `?email=${encodeURIComponent(email)}` : "";
  return `${CHECKOUT_BASE}/${p.id}${q}`;
}

/** checkout_link (short ID) → plano interno. */
export function planoByCheckoutLink(link: string | null | undefined): Plano | null {
  if (!link) return null;
  for (const cfg of Object.values(KIWIFY_PLANS)) {
    if (cfg.id === link) return cfg.plano;
  }
  return null;
}

export type KiwifyEvento = "approved" | "refund" | "cancelled" | null;

/** webhook_event_type da Kiwify → ação interna. */
export function mapEvento(tipo: string | null | undefined): KiwifyEvento {
  const t = (tipo ?? "").toLowerCase();
  if (
    ["order_approved", "purchase_complete", "purchase_approved", "subscription_renewed", "paid"].includes(t)
  )
    return "approved";
  if (["purchase_refunded", "refund", "chargeback"].includes(t)) return "refund";
  if (
    ["subscription_cancelled", "subscription_cancellation", "subscription_canceled"].includes(t)
  )
    return "cancelled";
  return null;
}

/**
 * Valida a assinatura do webhook Kiwify: HMAC-SHA1 do corpo cru usando
 * KIWIFY_WEBHOOK_SECRET, comparada (constante) com o ?signature= (hex).
 */
export function validateKiwifySignature(
  rawBody: string,
  signature: string | null | undefined,
): boolean {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
