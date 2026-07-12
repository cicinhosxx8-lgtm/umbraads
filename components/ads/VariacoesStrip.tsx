import { metaAdLibraryUrl } from "@/lib/format";

/**
 * "Variações ativas": a API de busca entrega a CONTAGEM de variações
 * (collation_count), mas não o criativo de cada uma. Então mostramos o número
 * (sinal de escala) + um atalho para ver TODAS as variações na Biblioteca de
 * Anúncios da Meta, onde cada criativo aparece.
 */
export function VariacoesStrip({
  total,
  adArchiveId,
}: {
  total: number;
  adArchiveId: string;
}) {
  const url = metaAdLibraryUrl(adArchiveId);
  const plural = total !== 1;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-app px-4 py-3.5">
      <div className="shrink-0 text-center">
        <div className="text-[26px] font-extrabold leading-none text-brand tabular">
          {total}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
          {plural ? "variações" : "variação"}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[13px] leading-snug text-zinc-400">
          {plural
            ? `Este criativo está rodando em ${total} variações ativas — quanto mais no ar, mais a oferta está escalando.`
            : "Só 1 criativo ativo por enquanto."}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-[12.5px] font-semibold text-brand hover:text-brand-hover"
        >
          Ver {plural ? `as ${total} variações` : "na Meta Ad Library"} ↗
        </a>
      </div>
    </div>
  );
}
