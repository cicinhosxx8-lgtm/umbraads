/**
 * Placeholder temporário das telas ainda não convertidas.
 * Mantém o padding do <main> do design (32px / max-w 1280px) para o shell
 * já nascer com o espaçamento certo. Substituído pelo conteúdo real nas
 * FASES 3-5.
 */
export function PhasePlaceholder({
  titulo,
  fase,
  descricao,
}: {
  titulo: string;
  fase: string;
  descricao: string;
}) {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-8 pb-12 pt-8">
      <div className="mb-7">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em] text-zinc-100">
          {titulo}
        </h1>
        <p className="mt-2 text-[15px] text-zinc-400">{descricao}</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-8 text-sm text-zinc-500">
        <span className="rounded-md bg-line px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
          {fase}
        </span>
        Tela em construção — conteúdo real chega nesta fase.
      </div>
    </main>
  );
}
