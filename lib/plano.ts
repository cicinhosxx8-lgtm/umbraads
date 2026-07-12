import type { Plano } from "@/lib/types/database";

/** Rótulo humano de cada plano. */
export const PLANO_LABEL: Record<Plano, string> = {
  free: "Free",
  basico: "Básico",
  pro: "Pro",
  elite: "Elite",
};

/**
 * Limites por plano (fonte da verdade do produto). Infinity = ilimitado.
 * Reutilizado nas API routes das FASES 3-5 para barrar excedente.
 */
export const LIMITES: Record<
  "buscas" | "monitorados" | "rastreados",
  Record<Plano, number>
> = {
  // buscas por dia
  buscas: { free: 10, basico: 50, pro: Infinity, elite: Infinity },
  // anúncios monitorados simultâneos
  monitorados: { free: 3, basico: 15, pro: 50, elite: Infinity },
  // rastreios (páginas/keywords) ativos
  rastreados: { free: 0, basico: 3, pro: 15, elite: 50 },
};

/** Formata um limite para exibição ("15" ou "∞"). */
export function fmtLimite(n: number): string {
  return Number.isFinite(n) ? String(n) : "∞";
}
