import Link from "next/link";

import type { Ad } from "@/lib/types/database";
import { formatCriativo, gradientFor } from "@/lib/format";
import { scaleFaixa } from "@/lib/utils";
import { ScaleBandBadge } from "@/components/ads/ScaleBadge";

/**
 * Card do "Top escalando agora" (design: Dashboard.dc.html) — thumb baixa,
 * badge Ativo, tipo, e Scale Score em destaque.
 */
export function TopAdCard({ ad }: { ad: Ad }) {
  return (
    <Link
      href={`/ofertas/${ad.id}?p=${ad.page_id}`}
      className="block overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-hover"
    >
      <div
        className="relative h-[120px]"
        style={{ background: gradientFor(ad.nicho, ad.ativo) }}
      >
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-app/70 px-[9px] py-1 text-[10.5px] font-semibold backdrop-blur-[4px]">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: ad.ativo ? "#10b981" : "#ef4444" }}
          />
          <span style={{ color: ad.ativo ? "#34d399" : "#f87171" }}>
            {ad.ativo ? "Ativo" : "Morto"}
          </span>
        </div>
        <div className="absolute bottom-2.5 right-2.5 rounded-md bg-app/70 px-2 py-[3px] text-[10.5px] font-semibold text-zinc-300 backdrop-blur-[4px]">
          {formatCriativo(ad.tipo_criativo)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-zinc-100">
              {ad.page_name ?? "—"}
            </div>
            <div className="mt-1 text-[11.5px] text-zinc-500 tabular">
              {ad.dias_ativo ?? 0} dias no ar · {ad.variacoes_ativas} variações
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-extrabold leading-none text-brand tabular">
              {ad.scale_score}
            </div>
            {scaleFaixa(ad.scale_score) === "escalando" ? (
              <div className="mt-1.5">
                <ScaleBandBadge score={ad.scale_score} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
