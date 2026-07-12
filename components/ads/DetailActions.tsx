"use client";

/**
 * Botões grandes de ação do detalhe (Monitorar / Rastrear).
 * Visual do design; a ligação real com o banco é da FASE 4.
 */
export function DetailActions({
  adId: _adId,
  pageId: _pageId,
}: {
  adId: string;
  pageId: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        className="w-full rounded-[10px] bg-brand py-3.5 text-[15px] font-bold text-app transition-colors hover:bg-brand-hover"
      >
        👁 Monitorar esta oferta
      </button>
      <button
        type="button"
        className="w-full rounded-[10px] border border-line-hover bg-transparent py-3.5 text-[15px] font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-[#1f1f23]"
      >
        🔔 Rastrear esta página
      </button>
    </div>
  );
}
