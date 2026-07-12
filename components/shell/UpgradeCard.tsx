import Link from "next/link";

import type { Plano } from "@/lib/types/database";
import { PLANO_LABEL, fmtLimite } from "@/lib/plano";

/**
 * Card do rodapé da sidebar (design: Dashboard.dc.html). Badge do plano +
 * uso de rastreios + botão de upgrade. Números vêm reais do profile/uso.
 */
export function UpgradeCard({
  plano,
  rastreiosUsados,
  rastreiosLimite,
}: {
  plano: Plano;
  rastreiosUsados: number;
  rastreiosLimite: number;
}) {
  return (
    <div className="rounded-[14px] border border-line bg-app p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-brand px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.04em] text-app">
          {plano === "free" ? "Free" : PLANO_LABEL[plano]}
        </span>
        <span className="text-[13px] font-bold text-zinc-100">
          Plano {PLANO_LABEL[plano]}
        </span>
      </div>
      <div className="mb-3 text-xs leading-relaxed text-zinc-500">
        Rastreios: {rastreiosUsados} de {fmtLimite(rastreiosLimite)} usados.
      </div>
      <Link
        href="/ajustes"
        className="block w-full rounded-lg bg-brand py-[9px] text-center text-[13px] font-bold text-app transition-colors hover:bg-brand-hover"
      >
        Fazer upgrade
      </Link>
    </div>
  );
}
