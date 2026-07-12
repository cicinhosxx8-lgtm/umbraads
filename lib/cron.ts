import "server-only";

import type { NextRequest } from "next/server";

/**
 * Valida a chamada de cron. A Vercel Cron envia
 * `Authorization: Bearer <CRON_SECRET>`. Também aceitamos o header
 * `x-cron-secret` para disparo manual/testes.
 */
export function cronAutorizado(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (request.headers.get("x-cron-secret") === secret) return true;
  return false;
}
