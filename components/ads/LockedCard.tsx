import Link from "next/link";

/**
 * Card bloqueado do feed para o plano Free. É um SKELETON borrado (nenhum dado
 * real do anúncio chega ao cliente — a gate é de verdade) com o painel
 * "BLOQUEADO / Assinar pra ver" no centro, no estilo da referência.
 */
export function LockedCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
      {/* skeleton borrado (conteúdo fake, só pra dar forma) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none blur-[7px]"
      >
        <div
          className="aspect-video"
          style={{ background: "linear-gradient(135deg,#242018,#463c1e)" }}
        />
        <div className="flex flex-col gap-2.5 p-4">
          <div className="h-4 w-2/3 rounded bg-line" />
          <div className="h-3 w-1/2 rounded bg-line" />
          <div className="h-3 w-3/4 rounded bg-line" />
          <div className="mt-1 h-8 rounded bg-line" />
        </div>
      </div>

      {/* painel de bloqueio */}
      <div className="absolute inset-0 flex items-center justify-center bg-app/30">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface/95 px-5 py-4 text-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-brand"
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.4)",
            }}
          >
            🔒
          </div>
          <div className="text-[11px] font-bold tracking-wide text-zinc-300">
            BLOQUEADO
          </div>
          <Link
            href="/ajustes"
            className="rounded-md bg-brand px-3 py-1.5 text-[12.5px] font-bold text-app transition-colors hover:bg-brand-hover"
          >
            Assinar pra ver
          </Link>
        </div>
      </div>
    </div>
  );
}
