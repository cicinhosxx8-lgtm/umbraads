import { scaleFaixa } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Badge do Scale Score — cores e faixas EXATAS do design (ofertas/detalhe):
 *  71+  ESCALANDO  (âmbar sólido, texto escuro, pulso)
 *  31–70 Aquecendo (âmbar suave)
 *  0–30  Fraco     (zinc)
 *
 * variant:
 *  - "full"    → "{score} · {band}"  (card do feed)
 *  - "score"   → só o número          (mini cards)
 */
const STYLES = {
  escalando: { color: "#09090b", background: "#f59e0b", borderColor: "#f59e0b" },
  aquecendo: {
    color: "#fcd34d",
    background: "rgba(245,158,11,0.14)",
    borderColor: "rgba(245,158,11,0.4)",
  },
  fraco: {
    color: "#a1a1aa",
    background: "rgba(113,113,122,0.16)",
    borderColor: "#3f3f46",
  },
} as const;

const LABEL = {
  escalando: "ESCALANDO",
  aquecendo: "Aquecendo",
  fraco: "Fraco",
} as const;

export function ScaleBadge({
  score,
  variant = "full",
  className,
}: {
  score: number;
  variant?: "full" | "score";
  className?: string;
}) {
  const faixa = scaleFaixa(score);
  const style = STYLES[faixa];
  const pulse = faixa === "escalando";

  return (
    <span
      className={cn(
        "inline-block rounded-lg border px-[9px] py-1 text-[11px] font-extrabold tabular",
        pulse && "animate-umbra-pulse",
        className,
      )}
      style={style}
    >
      {variant === "full" ? `${score} · ${LABEL[faixa]}` : score}
    </span>
  );
}

/** Badge grande "ESCALANDO/Aquecendo/Fraco" sem número (bloco do detalhe). */
export function ScaleBandBadge({ score }: { score: number }) {
  const faixa = scaleFaixa(score);
  const style = STYLES[faixa];
  return (
    <span
      className={cn(
        "inline-block rounded-[7px] px-[10px] py-1 text-[11px] font-extrabold tracking-[0.04em]",
        faixa === "escalando" && "animate-umbra-pulse",
      )}
      style={style}
    >
      {LABEL[faixa]}
    </span>
  );
}
