"use client";

import { useRef, useState } from "react";

import type { Ad } from "@/lib/types/database";
import { cn } from "@/lib/utils";

/**
 * Ações rápidas do card (Monitorar / Rastrear página) — ligadas de verdade.
 * Toggle idempotente: o POST devolve o id (ou o existente), então o próximo
 * clique remove. Erros de limite de plano aparecem num balãozinho.
 */
export function AdActions({
  adId,
  pageId,
  ad,
}: {
  adId: string;
  pageId: string;
  ad?: Ad; // anúncio ao vivo (não está no banco) — enviado ao monitorar
}) {
  const [monitoradoId, setMonitoradoId] = useState<string | null>(null);
  const [rastreadoId, setRastreadoId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ msg: string; erro: boolean } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function mostra(msg: string, erro = false) {
    setFlash({ msg, erro });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(null), 2400);
  }

  async function monitorar() {
    if (busy) return;
    setBusy(true);
    try {
      if (monitoradoId) {
        await fetch(`/api/monitorados?id=${monitoradoId}`, { method: "DELETE" });
        setMonitoradoId(null);
        mostra("Removido do monitoramento");
      } else {
        const res = await fetch("/api/monitorados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad_id: adId, ad }),
        });
        const data = await res.json();
        if (!res.ok) return mostra(data.error ?? "Não deu pra monitorar", true);
        setMonitoradoId(data.monitorado.id);
        mostra(data.jaExistia ? "Já estava monitorando" : "Monitorando ✓");
      }
    } finally {
      setBusy(false);
    }
  }

  async function rastrear() {
    if (busy) return;
    setBusy(true);
    try {
      if (rastreadoId) {
        await fetch(`/api/rastreados?id=${rastreadoId}`, { method: "DELETE" });
        setRastreadoId(null);
        mostra("Rastreio removido");
      } else {
        const res = await fetch("/api/rastreados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "pagina", valor: pageId }),
        });
        const data = await res.json();
        if (!res.ok) return mostra(data.error ?? "Não deu pra rastrear", true);
        setRastreadoId(data.rastreado.id);
        mostra(data.jaExistia ? "Já rastreando essa página" : "Rastreando ✓");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      {flash ? (
        <span
          className={cn(
            "absolute bottom-[calc(100%+8px)] right-0 z-10 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold",
            flash.erro
              ? "border-bad/40 bg-app text-bad-soft"
              : "border-line-hover bg-app text-zinc-100",
          )}
        >
          {flash.msg}
        </span>
      ) : null}

      <button
        type="button"
        onClick={monitorar}
        disabled={busy}
        className={cn("u-act group", monitoradoId && "!border-brand !text-brand")}
        aria-label="Monitorar"
      >
        👁
        <span className="u-tip group-hover:opacity-100">
          {monitoradoId ? "Parar de monitorar" : "Monitorar"}
        </span>
      </button>

      <button
        type="button"
        onClick={rastrear}
        disabled={busy}
        className={cn("u-act group", rastreadoId && "!border-brand !text-brand")}
        aria-label="Rastrear página"
      >
        🔔
        <span className="u-tip group-hover:opacity-100">
          {rastreadoId ? "Parar de rastrear" : "Rastrear página"}
        </span>
      </button>
    </div>
  );
}
