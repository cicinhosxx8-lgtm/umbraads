/**
 * Utilitários pequenos e sem dependências extras.
 */

/** Junta classes condicionais (substituto minimalista do clsx). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Faixas do Scale Score (regra de negócio central do produto). */
export type ScaleFaixa = "fraco" | "aquecendo" | "escalando";

export function scaleFaixa(score: number): ScaleFaixa {
  if (score >= 71) return "escalando";
  if (score >= 31) return "aquecendo";
  return "fraco";
}

/** Rótulo humano da faixa, como aparece nos badges do design. */
export function scaleLabel(score: number): string {
  const map: Record<ScaleFaixa, string> = {
    fraco: "Fraco",
    aquecendo: "Aquecendo",
    escalando: "ESCALANDO",
  };
  return map[scaleFaixa(score)];
}

/** Formata número com separador de milhar PT-BR. */
export function nf(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}
