"use client";

import { useState } from "react";

import type { Plano, Rastreado, RastreadoTipo } from "@/lib/types/database";
import { fmtLimite } from "@/lib/plano";
import { cn } from "@/lib/utils";

function diasDesde(ts: string): number {
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? 0
    : Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

export function RastreadosView({
  initial,
  limite,
}: {
  initial: Rastreado[];
  plano: Plano;
  limite: number;
}) {
  const [rows, setRows] = useState<Rastreado[]>(initial);
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<RastreadoTipo>("pagina");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ativos = rows.filter((r) => r.ativo).length;
  const pct = Number.isFinite(limite)
    ? Math.min(100, Math.round((ativos / Math.max(1, limite)) * 100))
    : 0;

  async function adicionar() {
    const v = valor.trim();
    if (!v || busy) return;
    setBusy(true);
    setErro(null);
    try {
      const res = await fetch("/api/rastreados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, valor: v }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível rastrear.");
        return;
      }
      if (!data.jaExistia) setRows((prev) => [data.rastreado, ...prev]);
      setValor("");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(r: Rastreado) {
    const novo = !r.ativo;
    setErro(null);
    setRows((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, ativo: novo } : x)),
    );
    const res = await fetch("/api/rastreados", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, ativo: novo }),
    });
    if (!res.ok) {
      // reverte + mostra erro (ex.: limite ao reativar)
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Não foi possível atualizar.");
      setRows((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, ativo: r.ativo } : x)),
      );
    }
  }

  async function remover(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/rastreados?id=${id}`, { method: "DELETE" });
  }

  return (
    <div>
      {/* adicionar */}
      <div className="mb-3.5 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            className="u-in min-w-[240px] flex-1"
            type="text"
            placeholder="Cole o link ou ID da página… ou digite uma palavra-chave"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") adicionar();
            }}
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as RastreadoTipo)}
            className="cursor-pointer appearance-none rounded-[10px] border border-line bg-app px-3.5 py-[11px] text-sm text-zinc-300 outline-none"
          >
            <option value="pagina">Página</option>
            <option value="keyword">Palavra-chave</option>
          </select>
          <button
            type="button"
            onClick={adicionar}
            disabled={busy}
            className="whitespace-nowrap rounded-[10px] bg-brand px-6 py-[11px] text-sm font-bold text-app transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            Rastrear
          </button>
        </div>
        {erro ? (
          <div className="mt-3 text-[13px] text-bad-soft">{erro}</div>
        ) : null}
      </div>

      {/* uso */}
      <div className="mb-4 flex w-[280px] items-center gap-3">
        <span className="whitespace-nowrap text-[12.5px] text-zinc-500">
          {ativos} de {fmtLimite(limite)} rastreios
        </span>
        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* lista */}
      {rows.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {rows.map((r) => {
            const keyword = r.tipo === "keyword";
            return (
              <div
                key={r.id}
                className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0"
              >
                <div
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] text-lg"
                  style={{
                    background: keyword
                      ? "rgba(139,92,246,0.12)"
                      : "rgba(245,158,11,0.1)",
                  }}
                >
                  {keyword ? "🔎" : "📄"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[14.5px] font-bold text-zinc-100">
                      {r.valor}
                    </span>
                    <span className="shrink-0 rounded-[5px] bg-line px-[7px] py-0.5 text-[10.5px] font-semibold text-zinc-400">
                      {keyword ? "Palavra-chave" : "Página"}
                    </span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-zinc-500">
                    Rastreando há {diasDesde(r.criado_em)} dias ·{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        r.ativo ? "text-good-soft" : "text-zinc-600",
                      )}
                    >
                      {r.ativo ? "ativo" : "pausado"}
                    </span>
                  </div>
                </div>
                {/* toggle */}
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  aria-label={r.ativo ? "Pausar" : "Ativar"}
                  className="relative h-[22px] w-10 shrink-0 rounded-full transition-colors"
                  style={{ background: r.ativo ? "#f59e0b" : "#3f3f46" }}
                >
                  <span
                    className="absolute top-0.5 h-[18px] w-[18px] rounded-full bg-zinc-100 transition-[left]"
                    style={{ left: r.ativo ? 20 : 2 }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => remover(r.id)}
                  className="u-iconbtn u-trash"
                  style={{ height: 32, width: 32 }}
                  aria-label="Remover"
                >
                  🗑
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <div className="text-[15px] font-semibold text-zinc-300">
            Nenhum rastreio ainda.
          </div>
          <div className="mt-1.5 text-sm text-zinc-500">
            Adicione uma página ou palavra-chave acima pra começar a receber
            alertas.
          </div>
        </div>
      )}
    </div>
  );
}
