"use client";

import { useState } from "react";

import type { Alerta, Plano, Rastreado } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { RastreadosView } from "@/components/rastreados/RastreadosView";
import { AlertasView } from "@/components/rastreados/AlertasView";

type Tab = "rastreados" | "alertas";

export function RastreadosTabs({
  initialTab,
  rastreados,
  plano,
  limite,
  alertas,
  alertasCursor,
  naoLidos,
}: {
  initialTab: Tab;
  rastreados: Rastreado[];
  plano: Plano;
  limite: number;
  alertas: Alerta[];
  alertasCursor: string | null;
  naoLidos: number;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-line">
        <TabButton active={tab === "rastreados"} onClick={() => setTab("rastreados")}>
          Rastreados
        </TabButton>
        <TabButton active={tab === "alertas"} onClick={() => setTab("alertas")}>
          Alertas
          {naoLidos > 0 ? (
            <span className="ml-1 inline-block rounded-full bg-brand px-[7px] py-px align-middle text-[11px] font-extrabold text-app">
              {naoLidos}
            </span>
          ) : null}
        </TabButton>
      </div>

      {tab === "rastreados" ? (
        <RastreadosView initial={rastreados} plano={plano} limite={limite} />
      ) : (
        <AlertasView initial={alertas} initialCursor={alertasCursor} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px cursor-pointer border-b-2 px-[18px] py-3 text-[14.5px] font-semibold",
        active
          ? "border-brand text-zinc-100"
          : "border-transparent text-zinc-500 hover:text-zinc-300",
      )}
    >
      {children}
    </button>
  );
}
