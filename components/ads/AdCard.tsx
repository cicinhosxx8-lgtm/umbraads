import Link from "next/link";

import type { Ad } from "@/lib/types/database";
import { formatCriativo, gradientFor, paisFlag, tendencia, truncate } from "@/lib/format";
import { ScaleBadge } from "@/components/ads/ScaleBadge";
import { StatusDot } from "@/components/ads/StatusDot";
import { Thumb } from "@/components/ads/Thumb";
import { AdActions } from "@/components/ads/AdActions";

/**
 * Card de anúncio do feed (Ofertas Escaladas.dc.html). Componente reutilizável:
 * thumb 16:9 com tipo + Scale Score, corpo com status, variações + tendência +
 * país, copy, e rodapé com "Ver detalhes" + ações rápidas.
 */
export function AdCard({ ad }: { ad: Ad }) {
  const trend = tendencia(ad.variacoes_ativas, ad.variacoes_7d_atras);
  const statusText = ad.ativo
    ? `Ativo há ${ad.dias_ativo ?? 0} dias`
    : "Morto";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-hover">
      <Thumb
        gradient={gradientFor(ad.nicho, ad.ativo)}
        url={ad.snapshot_url}
        alt={ad.page_name ?? ""}
        className="aspect-video"
      >
        <div className="absolute bottom-2.5 left-2.5 rounded-md bg-app/70 px-[9px] py-[3px] text-[11px] font-semibold text-zinc-300 backdrop-blur-[4px]">
          {formatCriativo(ad.tipo_criativo)}
        </div>
        <div className="absolute right-2.5 top-2.5">
          <ScaleBadge score={ad.scale_score} variant="full" />
        </div>
      </Thumb>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="text-[15px] font-bold text-zinc-100">
          {ad.page_name ?? "Página desconhecida"}
        </div>

        <StatusDot ativo={ad.ativo} label={statusText} />

        <div className="flex items-center gap-3 text-[12.5px] text-zinc-400 tabular">
          <span className="font-semibold text-zinc-300">
            {ad.variacoes_ativas} variações
          </span>
          <span
            className="font-bold"
            style={{ color: trend.up ? "#34d399" : "#f87171" }}
          >
            {trend.label}
          </span>
          <span className="ml-auto text-zinc-500">{paisFlag(ad.pais)}</span>
        </div>

        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] italic leading-snug text-zinc-500">
          &ldquo;{truncate(ad.copy_texto, 90)}&rdquo;
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
          <Link
            href={`/ofertas/${ad.id}`}
            className="flex-1 rounded-lg border border-line-hover py-2 text-center text-[13px] font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
          >
            Ver detalhes
          </Link>
          <AdActions adId={ad.id} pageId={ad.page_id} />
        </div>
      </div>
    </div>
  );
}
