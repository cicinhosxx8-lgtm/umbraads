"use client";

import { useState } from "react";
import Link from "next/link";

import type { Alerta, AlertaTipo } from "@/lib/types/database";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIPO_META: Record<AlertaTipo, { icon: string; iconBg: string }> = {
  novo_anuncio: { icon: "🔔", iconBg: "rgba(245,158,11,0.14)" },
  explosao_variacoes: { icon: "🚀", iconBg: "rgba(16,185,129,0.14)" },
  oferta_morta: { icon: "💀", iconBg: "rgba(239,68,68,0.14)" },
};

const FILTROS: Array<{ id: string; tipo: AlertaTipo | ""; label: string }> = [
  { id: "todos", tipo: "", label: "Todos" },
  { id: "criativo", tipo: "novo_anuncio", label: "Criativo novo" },
  { id: "explosao", tipo: "explosao_variacoes", label: "Explosão" },
  { id: "morta", tipo: "oferta_morta", label: "Oferta morta" },
];

/** Rótulo de grupo por data. */
function grupoDe(ts: string): string {
  const d = new Date(ts);
  const hoje = new Date();
  const diff = Math.floor(
    (hoje.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diff <= 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff < 7) return "Esta semana";
  return "Anteriores";
}

const ORDEM_GRUPOS = ["Hoje", "Ontem", "Esta semana", "Anteriores"];

export function AlertasView({
  initial,
  initialCursor,
}: {
  initial: Alerta[];
  initialCursor: string | null;
}) {
  const [alertas, setAlertas] = useState<Alerta[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [filtro, setFiltro] = useState("todos");
  const [busy, setBusy] = useState(false);

  async function aplicarFiltro(id: string) {
    setFiltro(id);
    setBusy(true);
    const tipo = FILTROS.find((f) => f.id === id)?.tipo ?? "";
    const res = await fetch(`/api/alertas${tipo ? `?tipo=${tipo}` : ""}`);
    const data = await res.json();
    setAlertas(data.alertas ?? []);
    setCursor(data.nextCursor ?? null);
    setBusy(false);
  }

  async function carregarMais() {
    if (!cursor || busy) return;
    setBusy(true);
    const tipo = FILTROS.find((f) => f.id === filtro)?.tipo ?? "";
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    params.set("cursor", cursor);
    const res = await fetch(`/api/alertas?${params.toString()}`);
    const data = await res.json();
    setAlertas((prev) => [...prev, ...(data.alertas ?? [])]);
    setCursor(data.nextCursor ?? null);
    setBusy(false);
  }

  async function marcarLido(id: string) {
    setAlertas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, lido: true } : a)),
    );
    await fetch("/api/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function marcarTodos() {
    setAlertas((prev) => prev.map((a) => ({ ...a, lido: true })));
    await fetch("/api/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  // agrupa preservando a ordem (já vem por criado_em desc)
  const grupos = ORDEM_GRUPOS.map((label) => ({
    label,
    items: alertas.filter((a) => grupoDe(a.criado_em) === label),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      {/* filtros */}
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const ativo = filtro === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => aplicarFiltro(f.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold",
                  ativo
                    ? "border-line-hover bg-line text-brand"
                    : "border-line bg-surface text-zinc-400",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={marcarTodos}
          className="rounded-lg border border-line-hover px-3.5 py-2 text-[13px] font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          Marcar todos como lidos
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <div className="text-[15px] font-semibold text-zinc-300">
            Nenhum alerta por aqui.
          </div>
          <div className="mt-1.5 text-sm text-zinc-500">
            Rastreie páginas e keywords — os avisos aparecem aqui assim que algo
            mudar.
          </div>
        </div>
      ) : (
        grupos.map((g) => (
          <div key={g.label} className="mb-[26px]">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.06em] text-zinc-500">
              {g.label}
            </div>
            <div className="flex flex-col gap-2.5">
              {g.items.map((a) => {
                const meta = TIPO_META[a.tipo];
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3.5 rounded-[11px] border border-line px-[18px] py-3.5"
                    style={{
                      borderLeft: `3px solid ${a.lido ? "#27272a" : "#f59e0b"}`,
                      background: a.lido ? "#18181b" : "#1c1c20",
                    }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-base"
                      style={{ background: meta.iconBg }}
                    >
                      {meta.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] leading-snug text-zinc-100">
                        {a.titulo ?? "Novo evento no seu radar."}
                      </div>
                      <div className="mt-[3px] text-[11.5px] text-zinc-500">
                        {timeAgo(a.criado_em)}
                      </div>
                    </div>
                    {!a.lido ? (
                      <button
                        type="button"
                        onClick={() => marcarLido(a.id)}
                        className="shrink-0 whitespace-nowrap rounded-lg border border-line-hover px-3 py-1.5 text-[12px] font-semibold text-zinc-400 transition-colors hover:border-brand hover:text-brand"
                      >
                        Marcar lido
                      </button>
                    ) : null}
                    <Link
                      href={linkDoAlerta(a)}
                      className="shrink-0 whitespace-nowrap rounded-lg border border-line-hover px-3 py-1.5 text-[12.5px] font-semibold text-zinc-300 transition-colors hover:border-brand hover:text-brand"
                    >
                      Ver anúncios →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {cursor ? (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={carregarMais}
            disabled={busy}
            className="rounded-[10px] border border-line-hover bg-surface px-8 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 disabled:opacity-60"
          >
            {busy ? "Carregando…" : "Carregar mais"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Destino do "Ver anúncios" a partir do payload do alerta (defensivo). */
function linkDoAlerta(a: Alerta): string {
  const p = (a.payload ?? {}) as Record<string, unknown>;
  const q = p.page_name ?? p.valor ?? p.keyword;
  return typeof q === "string" && q ? `/ofertas?q=${encodeURIComponent(q)}` : "/ofertas";
}
