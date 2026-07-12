/**
 * Scale Score — pontuação central do UmbraAds.
 *
 *   score = (variacoes_ativas * 2) + (crescimento_7d * 5) + min(dias_ativo, 60)
 *   crescimento_7d = variacoes_ativas - variacoes_7d_atras
 *
 * O crescimento pode ser negativo (oferta encolhendo), o que derruba o score.
 * O resultado final nunca é negativo.
 */
export function computeScaleScore(input: {
  variacoesAtivas: number;
  variacoes7dAtras?: number | null;
  diasAtivo?: number | null;
}): number {
  const va = input.variacoesAtivas || 0;
  const anterior = input.variacoes7dAtras ?? va;
  const crescimento = va - anterior;
  const dias = Math.min(Math.max(input.diasAtivo ?? 0, 0), 60);
  const score = va * 2 + crescimento * 5 + dias;
  return Math.max(0, Math.round(score));
}
