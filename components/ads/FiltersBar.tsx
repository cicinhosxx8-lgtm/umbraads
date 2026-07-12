"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Opções alinhadas aos nichos reais do banco (seed). O layout é o do design
// (Ofertas Escaladas.dc.html); os valores é que refletem os dados.
const NICHOS = [
  ["", "Nicho"],
  ["achadinhos", "Achadinhos"],
  ["beleza", "Beleza"],
  ["pet", "Pet"],
  ["renda extra", "Renda extra"],
  ["casa & cozinha", "Casa & cozinha"],
] as const;

const PAISES = [
  ["", "Todos os países"],
  ["BR", "Brasil"],
  ["US", "EUA"],
  ["GB", "Reino Unido"],
  ["ES", "Espanha"],
  ["MX", "México"],
  ["PT", "Portugal"],
] as const;

const FORMATOS = [
  ["", "Formato"],
  ["video", "Vídeo"],
  ["imagem", "Imagem"],
  ["carrossel", "Carrossel"],
] as const;

const STATUS = [
  ["ativo", "Status: Ativo"],
  ["morto", "Morto"],
  ["todos", "Todos"],
] as const;

const SORTS = [
  ["score", "Scale Score ↓"],
  ["recente", "Mais recente"],
  ["antigo", "Há mais tempo no ar"],
] as const;

export function FiltersBar() {
  const router = useRouter();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  const nicho = sp.get("nicho") ?? "";
  const pais = sp.get("pais") ?? "";
  const formato = sp.get("formato") ?? "";
  const status = sp.get("status") ?? "ativo";
  const dias = sp.get("dias") ?? "0";
  const minVar = sp.get("minVar") ?? "0";
  const sort = sp.get("sort") ?? "score";

  // busca por texto com debounce
  const [busca, setBusca] = useState(q);
  useEffect(() => setBusca(q), [q]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // valor "ao vivo" do slider (atualiza o número sem re-navegar a cada pixel)
  const [diasLive, setDiasLive] = useState(dias);
  useEffect(() => setDiasLive(dias), [dias]);

  function update(patch: Record<string, string>) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    p.delete("cursor"); // qualquer mudança de filtro reinicia a paginação
    const qs = p.toString();
    router.push(qs ? `/ofertas?${qs}` : "/ofertas");
  }

  function onBusca(v: string) {
    setBusca(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => update({ q: v.trim() }), 400);
  }

  // chips dos filtros ativos
  const chips: Array<{ key: string; label: string }> = [];
  if (nicho) chips.push({ key: "nicho", label: `Nicho: ${labelDe(NICHOS, nicho)}` });
  if (pais) chips.push({ key: "pais", label: `País: ${labelDe(PAISES, pais)}` });
  if (formato)
    chips.push({ key: "formato", label: `Formato: ${labelDe(FORMATOS, formato)}` });
  if (status && status !== "ativo")
    chips.push({ key: "status", label: `Status: ${labelDe(STATUS, status)}` });
  if (Number(dias) > 0) chips.push({ key: "dias", label: `Dias no ar: ${dias}+` });
  if (Number(minVar) > 0)
    chips.push({ key: "minVar", label: `Mín. ${minVar} variações` });
  if (q) chips.push({ key: "q", label: `"${q}"` });

  function limpar() {
    router.push("/ofertas");
  }

  return (
    <div className="sticky top-[60px] z-20 mb-3.5 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            🔍
          </span>
          <input
            className="u-in w-full pl-[34px]"
            type="text"
            placeholder="Buscar por palavra-chave, produto ou página…"
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
          />
        </div>

        <select
          className="u-sel"
          value={nicho}
          onChange={(e) => update({ nicho: e.target.value })}
        >
          {NICHOS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <select
          className="u-sel"
          value={pais}
          onChange={(e) => update({ pais: e.target.value })}
        >
          {PAISES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <select
          className="u-sel"
          value={formato}
          onChange={(e) => update({ formato: e.target.value })}
        >
          {FORMATOS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <select
          className="u-sel"
          value={status}
          onChange={(e) => update({ status: e.target.value })}
        >
          {STATUS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2.5 rounded-[9px] border border-line bg-app px-3 py-1.5">
          <span className="whitespace-nowrap text-xs text-zinc-500">Dias no ar</span>
          <input
            className="u-range w-[100px]"
            type="range"
            min={0}
            max={90}
            value={diasLive}
            onChange={(e) => setDiasLive(e.target.value)}
            onMouseUp={(e) => update({ dias: (e.target as HTMLInputElement).value })}
            onTouchEnd={(e) =>
              update({ dias: (e.target as HTMLInputElement).value })
            }
          />
          <span className="text-xs font-semibold text-brand-accent tabular">
            {diasLive}+
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-[9px] border border-line bg-app px-3 py-1.5">
          <span className="whitespace-nowrap text-xs text-zinc-500">
            Mín. variações
          </span>
          <input
            className="u-in w-[52px] border-none bg-transparent px-2 py-[3px]"
            type="number"
            min={0}
            defaultValue={minVar}
            onBlur={(e) => update({ minVar: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                update({ minVar: (e.target as HTMLInputElement).value });
            }}
          />
        </div>

        <select
          className="u-sel ml-auto"
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
        >
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* chips */}
      {chips.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
          <span className="text-xs font-medium text-zinc-500">Ativos:</span>
          {chips.map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center gap-[7px] rounded-full border px-2.5 py-1 text-[12.5px] font-semibold text-brand-accent"
              style={{
                background: "rgba(245,158,11,0.1)",
                borderColor: "rgba(245,158,11,0.28)",
              }}
            >
              {c.label}
              <button
                type="button"
                onClick={() => update({ [c.key]: "" })}
                className="cursor-pointer font-bold text-zinc-400 hover:text-zinc-100"
                aria-label={`Remover ${c.label}`}
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={limpar}
            className="ml-1.5 text-[12.5px] font-semibold text-zinc-400 hover:text-zinc-100"
          >
            Limpar filtros
          </button>
        </div>
      ) : null}
    </div>
  );
}

function labelDe(
  opts: ReadonlyArray<readonly [string, string]>,
  value: string,
): string {
  return opts.find(([v]) => v === value)?.[1] ?? value;
}
