"use client";

import { useState } from "react";

/**
 * Strip horizontal das variações ativas (design: Detalhe). Como o seed não
 * traz os criativos reais de cada variação, renderizamos N tiles ilustrativos
 * (N = variações ativas, limitado) no gradiente do anúncio, com seleção.
 */
export function VariacoesStrip({
  total,
  gradient,
}: {
  total: number;
  gradient: string;
}) {
  const [sel, setSel] = useState(0);
  const n = Math.min(Math.max(total, 1), 12);
  const tiles = Array.from({ length: n });

  return (
    <div className="u-scroll flex gap-2.5 overflow-x-auto pb-2">
      {tiles.map((_, i) => (
        <button
          type="button"
          key={i}
          onClick={() => setSel(i)}
          className="relative aspect-[9/12] w-[78px] shrink-0 rounded-[10px]"
          style={{
            background: gradient,
            border: `2px solid ${sel === i ? "#f59e0b" : "#27272a"}`,
          }}
          aria-label={`Variação ${i + 1}`}
        >
          <span className="absolute bottom-[5px] left-[5px] rounded bg-app/60 px-[5px] py-px text-[9px] font-bold text-zinc-100">
            v{i + 1}
          </span>
        </button>
      ))}
    </div>
  );
}
