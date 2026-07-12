"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PageSnapshot } from "@/lib/types/database";

/**
 * Gráfico "Evolução da página" (design: Detalhe do Anuncio.dc.html).
 * Área âmbar com gradiente sobre os snapshots de anúncios ativos (60 dias).
 */
export function EvolucaoChart({ snapshots }: { snapshots: PageSnapshot[] }) {
  const data = snapshots
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((s) => ({ data: s.data, ativos: s.anuncios_ativos ?? 0 }));

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-[13px] text-zinc-600">
        Sem histórico ainda para esta página.
      </div>
    );
  }

  const pico = data.reduce((m, d) => Math.max(m, d.ativos), 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="uarea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#27272a" />
          <XAxis dataKey="data" hide />
          <YAxis hide domain={[0, "dataMax + 2"]} />
          <Tooltip
            contentStyle={{
              background: "#09090b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#71717a" }}
            itemStyle={{ color: "#f59e0b" }}
            labelFormatter={(v) => new Date(String(v)).toLocaleDateString("pt-BR")}
            formatter={(v: number | string) => [`${v} ativos`, "Anúncios"]}
          />
          <Area
            type="monotone"
            dataKey="ativos"
            stroke="#f59e0b"
            strokeWidth={2.5}
            fill="url(#uarea)"
            dot={false}
            activeDot={{ r: 4.5, fill: "#f59e0b", stroke: "#18181b", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute right-[56px] top-2 rounded-lg border border-line-hover bg-app px-2.5 py-[5px] text-center">
        <div className="text-[9px] tracking-[0.04em] text-zinc-500">PICO</div>
        <div className="text-sm font-extrabold text-brand tabular">
          {pico} ativos
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-zinc-600">
        <span>-60d</span>
        <span>-40d</span>
        <span>-20d</span>
        <span>hoje</span>
      </div>
    </div>
  );
}
