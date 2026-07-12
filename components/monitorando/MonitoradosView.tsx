"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { Ad, Monitorado, MonitoradoStatus } from "@/lib/types/database";
import { gradientFor, truncate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScaleBadge } from "@/components/ads/ScaleBadge";

export type MonitoradoRow = Monitorado & { ads: Ad | null };

const STATUS_META: Record<
  MonitoradoStatus,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  observando: {
    label: "Observando",
    color: "#fcd34d",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
    icon: "",
  },
  validada: {
    label: "Validada 30d+",
    color: "#34d399",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.35)",
    icon: "✓ ",
  },
  morta: {
    label: "Morta",
    color: "#f87171",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
    icon: "",
  },
};

const TABS: Array<{ id: "todas" | MonitoradoStatus; label: string; color: string }> =
  [
    { id: "todas", label: "Todas", color: "#f4f4f5" },
    { id: "observando", label: "Observando", color: "#fcd34d" },
    { id: "validada", label: "Validadas", color: "#34d399" },
    { id: "morta", label: "Mortas", color: "#f87171" },
  ];

const SORTS = [
  ["mudanca", "Última mudança"],
  ["score", "Scale Score"],
  ["dias", "Dias no ar"],
  ["nome", "Nome da página"],
] as const;

const GRID = "grid-cols-[2.4fr_1.1fr_0.8fr_1.1fr_0.9fr_1.6fr_0.9fr]";

export function MonitoradosView({ initial }: { initial: MonitoradoRow[] }) {
  const [rows, setRows] = useState<MonitoradoRow[]>(initial);
  const [tab, setTab] = useState<"todas" | MonitoradoStatus>("todas");
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("mudanca");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const counts = useMemo(
    () => ({
      todas: rows.length,
      observando: rows.filter((r) => r.status === "observando").length,
      validada: rows.filter((r) => r.status === "validada").length,
      morta: rows.filter((r) => r.status === "morta").length,
    }),
    [rows],
  );

  const visiveis = useMemo(() => {
    const f = rows.filter((r) => tab === "todas" || r.status === tab);
    const s = [...f];
    s.sort((a, b) => {
      switch (sort) {
        case "score":
          return (b.ads?.scale_score ?? 0) - (a.ads?.scale_score ?? 0);
        case "dias":
          return (b.ads?.dias_ativo ?? 0) - (a.ads?.dias_ativo ?? 0);
        case "nome":
          return (a.ads?.page_name ?? "").localeCompare(b.ads?.page_name ?? "");
        default:
          return b.criado_em.localeCompare(a.criado_em);
      }
    });
    return s;
  }, [rows, tab, sort]);

  async function salvarNota(id: string) {
    const nota = draft;
    setEditing(null);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, nota } : r)));
    await fetch("/api/monitorados", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nota }),
    });
  }

  async function remover(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/monitorados?id=${id}`, { method: "DELETE" });
  }

  if (rows.length === 0) return <EmptyRadar />;

  return (
    <div>
      {/* filtros */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const ativo = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold",
                  ativo
                    ? "border-line-hover bg-line"
                    : "border-line bg-surface text-zinc-400",
                )}
                style={ativo ? { color: t.color } : undefined}
              >
                {t.label}{" "}
                <span className="tabular opacity-70">{counts[t.id]}</span>
              </button>
            );
          })}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="cursor-pointer appearance-none rounded-[9px] border border-line bg-surface px-3 py-2 text-[13px] text-zinc-300 outline-none"
        >
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* tabela */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div
          className={cn(
            "grid gap-3.5 border-b border-line bg-app px-5 py-3",
            GRID,
          )}
        >
          {["CRIATIVO", "STATUS", "DIAS", "VARIAÇÕES", "SCORE", "NOTA"].map(
            (h) => (
              <div
                key={h}
                className="text-[11px] font-bold tracking-[0.04em] text-zinc-500"
              >
                {h}
              </div>
            ),
          )}
          <div className="text-right text-[11px] font-bold tracking-[0.04em] text-zinc-500">
            AÇÕES
          </div>
        </div>

        {visiveis.map((r) => {
          const ad = r.ads;
          const meta = STATUS_META[r.status];
          const delta =
            (ad?.variacoes_ativas ?? 0) -
            (ad?.variacoes_7d_atras ?? ad?.variacoes_ativas ?? 0);
          const rowBg =
            r.status === "validada"
              ? "rgba(16,185,129,0.06)"
              : r.status === "morta"
                ? "rgba(239,68,68,0.06)"
                : "transparent";
          const temNota = !!(r.nota && r.nota.trim());
          return (
            <div
              key={r.id}
              className={cn(
                "grid items-center gap-3.5 border-b border-line px-5 py-3.5",
                GRID,
              )}
              style={{ background: rowBg }}
            >
              {/* criativo */}
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="h-11 w-11 shrink-0 rounded-[9px]"
                  style={{ background: gradientFor(ad?.nicho, ad?.ativo ?? true) }}
                />
                <div className="min-w-0">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold text-zinc-100">
                    {ad?.page_name ?? "—"}
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] italic text-zinc-500">
                    &ldquo;{truncate(ad?.copy_texto, 48)}&rdquo;
                  </div>
                </div>
              </div>
              {/* status */}
              <div>
                <span
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-[11.5px] font-bold"
                  style={{
                    color: meta.color,
                    background: meta.bg,
                    borderColor: meta.border,
                  }}
                >
                  {meta.icon}
                  {meta.label}
                </span>
              </div>
              {/* dias */}
              <div className="text-[13.5px] font-semibold text-zinc-300 tabular">
                {ad?.dias_ativo ?? 0}
              </div>
              {/* variações */}
              <div className="text-[13.5px] tabular">
                <span className="font-bold text-zinc-100">
                  {ad?.variacoes_ativas ?? 0}
                </span>{" "}
                <span
                  className="text-xs font-bold"
                  style={{ color: delta >= 0 ? "#34d399" : "#f87171" }}
                >
                  {delta >= 0 ? `↑ +${delta}` : `↓ ${delta}`}
                </span>
              </div>
              {/* score */}
              <div>
                <ScaleBadge
                  score={ad?.scale_score ?? 0}
                  variant="score"
                  className="px-2 py-[3px] text-[12px]"
                />
              </div>
              {/* nota */}
              <div className="min-w-0">
                {editing === r.id ? (
                  <input
                    className="u-noteinput"
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => salvarNota(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(r.id);
                      setDraft(r.nota ?? "");
                    }}
                    className="flex min-w-0 cursor-pointer items-center gap-1.5 text-left"
                  >
                    <span
                      className={cn(
                        "overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]",
                        temNota ? "italic text-zinc-400" : "text-zinc-600",
                      )}
                    >
                      {temNota ? r.nota : "+ adicionar nota"}
                    </span>
                    <span className="shrink-0 text-[11px] text-zinc-600">✎</span>
                  </button>
                )}
              </div>
              {/* ações */}
              <div className="flex justify-end gap-[7px]">
                <Link
                  href={ad ? `/ofertas/${ad.id}` : "#"}
                  className="u-iconbtn"
                  aria-label="Ver anúncio"
                >
                  ↗
                </Link>
                <button
                  type="button"
                  onClick={() => remover(r.id)}
                  className="u-iconbtn u-trash"
                  aria-label="Remover"
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}

        {visiveis.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-zinc-500">
            Nada em “{TABS.find((t) => t.id === tab)?.label}”.
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Estado vazio com radar animado (design). */
function EmptyRadar() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-8 py-20 text-center">
      <div className="relative mb-7 h-[140px] w-[140px]">
        <div className="absolute inset-0 rounded-full border border-line" />
        <div className="absolute inset-6 rounded-full border border-line" />
        <div className="absolute inset-12 rounded-full border border-line-hover" />
        <div
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
          style={{ boxShadow: "0 0 12px rgba(245,158,11,0.8)" }}
        />
        <div
          className="absolute left-1/2 top-0 h-1/2 w-1/2 origin-bottom-left rounded-tl-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(245,158,11,0.25), transparent 60%)",
            animation: "umbraRadar 4s linear infinite",
          }}
        />
      </div>
      <h2 className="m-0 mb-2.5 text-[22px] font-extrabold text-zinc-100">
        Seu radar tá vazio
      </h2>
      <p className="m-0 mb-[26px] max-w-[340px] text-[15px] leading-relaxed text-zinc-400">
        Marque ofertas no feed pra gente vigiar por você — 24/7, sem você mexer
        um dedo.
      </p>
      <Link
        href="/ofertas"
        className="rounded-[10px] bg-brand px-[26px] py-3 text-[15px] font-bold text-app transition-colors hover:bg-brand-hover"
      >
        Explorar ofertas escaladas
      </Link>
    </div>
  );
}
