/**
 * Helpers de formatação/apresentação compartilhados pelas telas de anúncios.
 * Sem dependências — puros e testáveis.
 */

/** Que tipo de mídia o card deve renderizar a partir do anúncio. */
export function creativeKind(ad: {
  snapshot_url: string | null;
  tipo_criativo: string | null;
}): "video" | "image" | "none" {
  if (!ad.snapshot_url) return "none";
  return (ad.tipo_criativo ?? "").toUpperCase() === "VIDEO" ? "video" : "image";
}

/** URL pública do anúncio na Biblioteca de Anúncios da Meta (sempre funciona). */
export function metaAdLibraryUrl(adArchiveId: string): string {
  return `https://www.facebook.com/ads/library/?id=${adArchiveId}`;
}

/** Ícone + rótulo do tipo de criativo (espelha os labels do design). */
export function formatCriativo(tipo: string | null | undefined): string {
  switch ((tipo ?? "").toUpperCase()) {
    case "VIDEO":
      return "▶ Vídeo";
    case "IMAGE":
      return "🖼 Imagem";
    case "DCO":
    case "CAROUSEL":
      return "⧉ Carrossel";
    case "DPA":
      return "⧉ Catálogo";
    default:
      return tipo ? `🖼 ${tipo}` : "🖼 Imagem";
  }
}

/** Bandeira + sigla do país. */
export function paisFlag(pais: string | null | undefined): string {
  const map: Record<string, string> = {
    BR: "🇧🇷 BR",
    PT: "🇵🇹 PT",
    US: "🇺🇸 US",
    ES: "🇪🇸 ES",
    GB: "🇬🇧 GB",
    MX: "🇲🇽 MX",
    DE: "🇩🇪 DE",
    FR: "🇫🇷 FR",
  };
  return map[(pais ?? "").toUpperCase()] ?? (pais ?? "—");
}

// Gradientes por nicho — o design usa thumbs em gradiente (não temos os
// criativos reais no seed). Anúncio morto vira cinza, como no design.
const GRAD_NICHO: Record<string, [string, string]> = {
  achadinhos: ["#2a2118", "#4a3a20"],
  beleza: ["#201f2a", "#2e2e4a"],
  pet: ["#2a1f1f", "#4a2e2e"],
  "renda extra": ["#26202e", "#3e2e4a"],
  "casa & cozinha": ["#28241a", "#48401f"],
};
const GRAD_DEFAULT: [string, string] = ["#242018", "#463c1e"];
const GRAD_MORTO: [string, string] = ["#242424", "#3a3a3a"];

/** CSS `linear-gradient(...)` determinístico para a thumb de um anúncio. */
export function gradientFor(
  nicho: string | null | undefined,
  ativo: boolean = true,
): string {
  const [a, b] = !ativo
    ? GRAD_MORTO
    : (GRAD_NICHO[(nicho ?? "").toLowerCase()] ?? GRAD_DEFAULT);
  return `linear-gradient(135deg,${a},${b})`;
}

/** Tempo relativo curto em PT-BR ("agora", "há 2h", "ontem", "há 3d"). */
export function timeAgo(input: string | Date | null | undefined): string {
  if (!input) return "";
  const then = typeof input === "string" ? new Date(input) : input;
  const ms = Date.now() - then.getTime();
  if (Number.isNaN(ms)) return "";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 30) return `há ${d}d`;
  return then.toLocaleDateString("pt-BR");
}

/** Data curta PT-BR (dd/mm/aaaa). */
export function dataBR(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

/** Trunca texto com reticências. */
export function truncate(s: string | null | undefined, n: number): string {
  const t = (s ?? "").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

/** Tendência de variações (subindo/caindo) a partir do histórico 7d. */
export function tendencia(
  atual: number,
  anterior: number | null | undefined,
): { up: boolean; label: string } {
  const prev = anterior ?? atual;
  const up = atual >= prev;
  return { up, label: up ? "↑ subindo" : "↓ caindo" };
}
