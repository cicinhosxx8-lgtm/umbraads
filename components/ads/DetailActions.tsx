"use client";

import { useState } from "react";

import type { Ad } from "@/lib/types/database";
import { cn } from "@/lib/utils";

/**
 * Ações do detalhe (Monitorar oferta / Rastrear página) — ligadas de verdade.
 * Recebe o estado inicial (ids) do Server Component, então já nasce refletindo
 * o que o usuário monitora/rastreia. Clique alterna (add/remove).
 */
export function DetailActions({
  adId,
  pageId,
  ad,
  initialMonitoradoId = null,
  initialRastreadoId = null,
}: {
  adId: string;
  pageId: string;
  ad?: Ad; // anúncio ao vivo — enviado ao monitorar (grava no banco só então)
  initialMonitoradoId?: string | null;
  initialRastreadoId?: string | null;
}) {
  const [monitoradoId, setMonitoradoId] = useState(initialMonitoradoId);
  const [rastreadoId, setRastreadoId] = useState(initialRastreadoId);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ msg: string; erro: boolean } | null>(null);

  async function monitorar() {
    if (busy) return;
    setBusy(true);
    setFlash(null);
    try {
      if (monitoradoId) {
        await fetch(`/api/monitorados?id=${monitoradoId}`, { method: "DELETE" });
        setMonitoradoId(null);
        setFlash({ msg: "Removido do monitoramento.", erro: false });
      } else {
        const res = await fetch("/api/monitorados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad_id: adId, ad }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFlash({ msg: data.error ?? "Não deu pra monitorar.", erro: true });
        } else {
          setMonitoradoId(data.monitorado.id);
          setFlash({ msg: "Oferta no seu radar 👁", erro: false });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function rastrear() {
    if (busy) return;
    setBusy(true);
    setFlash(null);
    try {
      if (rastreadoId) {
        await fetch(`/api/rastreados?id=${rastreadoId}`, { method: "DELETE" });
        setRastreadoId(null);
        setFlash({ msg: "Rastreio removido.", erro: false });
      } else {
        const res = await fetch("/api/rastreados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "pagina", valor: pageId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFlash({ msg: data.error ?? "Não deu pra rastrear.", erro: true });
        } else {
          setRastreadoId(data.rastreado.id);
          setFlash({ msg: "Rastreando essa página 🔔", erro: false });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={monitorar}
        disabled={busy}
        className={cn(
          "w-full rounded-[10px] py-3.5 text-[15px] font-bold transition-colors disabled:opacity-60",
          monitoradoId
            ? "border border-brand bg-brand/10 text-brand hover:bg-brand/20"
            : "bg-brand text-app hover:bg-brand-hover",
        )}
      >
        {monitoradoId ? "✓ Monitorando — remover" : "👁 Monitorar esta oferta"}
      </button>
      <button
        type="button"
        onClick={rastrear}
        disabled={busy}
        className={cn(
          "w-full rounded-[10px] border py-3.5 text-[15px] font-semibold transition-colors disabled:opacity-60",
          rastreadoId
            ? "border-brand bg-brand/10 text-brand hover:bg-brand/20"
            : "border-line-hover bg-transparent text-zinc-100 hover:border-zinc-500 hover:bg-[#1f1f23]",
        )}
      >
        {rastreadoId ? "✓ Rastreando página — remover" : "🔔 Rastrear esta página"}
      </button>

      {flash ? (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-center text-[13px]",
            flash.erro ? "text-bad-soft" : "text-good-soft",
          )}
        >
          {flash.msg}
        </div>
      ) : null}
    </div>
  );
}
