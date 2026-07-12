import Link from "next/link";

import type { Ad } from "@/lib/types/database";
import { formatCriativo, gradientFor } from "@/lib/format";
import { ScaleBadge } from "@/components/ads/ScaleBadge";
import { StatusDot } from "@/components/ads/StatusDot";
import { Thumb } from "@/components/ads/Thumb";

/**
 * Card compacto usado em "Mais anúncios desta página" (design: Detalhe).
 * Thumb 16:9 com tipo + score (só número) e um resumo curto abaixo.
 */
export function MiniAdCard({ ad }: { ad: Ad }) {
  return (
    <Link
      href={`/ofertas/${ad.id}`}
      className="block overflow-hidden rounded-[14px] border border-line bg-surface transition-colors hover:border-line-hover"
    >
      <Thumb
        gradient={gradientFor(ad.nicho, ad.ativo)}
        url={ad.snapshot_url}
        alt={ad.page_name ?? ""}
        className="aspect-video"
      >
        <div className="absolute bottom-2 left-2 rounded-[5px] bg-app/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 backdrop-blur-[4px]">
          {formatCriativo(ad.tipo_criativo)}
        </div>
        <div className="absolute right-2 top-2">
          <ScaleBadge score={ad.scale_score} variant="score" className="px-[7px] py-[3px] text-[10.5px]" />
        </div>
      </Thumb>
      <div className="p-[13px]">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold text-zinc-100">
          {ad.page_name ?? "—"}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-zinc-400">
          <StatusDot ativo={ad.ativo} />
          {ad.ativo ? `Ativo há ${ad.dias_ativo ?? 0} dias` : "Morto"} ·{" "}
          {ad.variacoes_ativas} var.
        </div>
      </div>
    </Link>
  );
}
