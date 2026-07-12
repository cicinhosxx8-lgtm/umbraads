import type { Ad } from "@/lib/types/database";
import {
  creativeKind,
  formatCriativo,
  gradientFor,
  metaAdLibraryUrl,
  proxiedCreative,
} from "@/lib/format";
import { StatusDot } from "@/components/ads/StatusDot";

/**
 * Criativo do anúncio na tela de detalhe. Toca o vídeo de verdade (nativo,
 * as URLs da FB CDN vêm com CORS liberado) ou mostra a imagem. Quando não há
 * URL (a busca da API não trouxe), cai num placeholder com link direto pra
 * Biblioteca de Anúncios da Meta — onde o criativo sempre aparece.
 */
export function AdCreative({ ad }: { ad: Ad }) {
  const kind = creativeKind(ad);
  const metaUrl = metaAdLibraryUrl(ad.ad_archive_id);
  const src = proxiedCreative(ad.snapshot_url);

  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line"
      style={{ background: gradientFor(ad.nicho, ad.ativo) }}
    >
      {kind === "video" && src ? (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full bg-black object-contain"
        />
      ) : kind === "image" && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={ad.page_name ?? ""}
          className="absolute inset-0 h-full w-full bg-black object-contain"
        />
      ) : (
        // sem criativo capturado → placeholder + link pra Meta
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <div className="text-[13px] text-zinc-400">
            Criativo não capturado nesta oferta.
          </div>
          <a
            href={metaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-app transition-colors hover:bg-brand-hover"
          >
            ▶ Ver na Meta Ad Library
          </a>
        </div>
      )}

      {/* badges sobrepostos */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-app/70 px-[11px] py-[5px] text-[11.5px] font-semibold backdrop-blur-[4px]">
        <StatusDot ativo={ad.ativo} />
        <span style={{ color: ad.ativo ? "#34d399" : "#f87171" }}>
          {ad.ativo ? "Ativo" : "Morto"}
        </span>
      </div>

      <a
        href={metaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 top-3 rounded-md bg-app/70 px-2.5 py-1 text-[11.5px] font-semibold text-zinc-200 backdrop-blur-[4px] transition-colors hover:text-brand"
      >
        Meta Ad Library ↗
      </a>

      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-app/70 px-2.5 py-1 text-[11.5px] font-semibold text-zinc-300 backdrop-blur-[4px]">
        {formatCriativo(ad.tipo_criativo)}
      </div>
    </div>
  );
}
