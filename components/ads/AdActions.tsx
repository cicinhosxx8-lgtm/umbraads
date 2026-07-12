"use client";

/**
 * Botões de ação rápida do card (Monitorar / Rastrear página).
 * Visual fiel ao design (.u-act com tooltip). A ligação real com o banco
 * acontece na FASE 4 — por ora são visuais (sem efeito).
 */
export function AdActions({
  adId: _adId,
  pageId: _pageId,
}: {
  adId: string;
  pageId: string;
}) {
  return (
    <>
      <button type="button" className="u-act group" aria-label="Monitorar">
        👁
        <span className="u-tip group-hover:opacity-100">Monitorar</span>
      </button>
      <button
        type="button"
        className="u-act group"
        aria-label="Rastrear página"
      >
        🔔
        <span className="u-tip group-hover:opacity-100">Rastrear página</span>
      </button>
    </>
  );
}
