import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { Ad, Monitorado, Alerta } from "@/lib/types/database";
import { feedLote } from "@/lib/ads-live";
import { timeAgo, gradientFor as gradiente } from "@/lib/format";
import { TopAdCard as TopAdCardServer } from "@/components/dashboard/TopAdCard";

export const dynamic = "force-dynamic";

const ALERTA_ICON: Record<string, string> = {
  novo_anuncio: "🔔",
  explosao_variacoes: "📈",
  oferta_morta: "💀",
};

const STATUS_PILL: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  observando: { label: "Observando", color: "#fcd34d", bg: "rgba(245,158,11,0.12)" },
  validada: { label: "Validada", color: "#34d399", bg: "rgba(16,185,129,0.12)" },
  morta: { label: "Morta", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
};

type MonitoradoComAd = Monitorado & { ads: Ad | null };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primeiroNome = nomeDe(user?.user_metadata?.full_name, user?.email);

  const seteDias = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [lote, naoLidos, monitorandoCount, alertasRes, radarRes] =
    await Promise.all([
      feedLote(), // anúncios ao vivo (cache 30 min) — top + contadores
      supabase
        .from("alertas")
        .select("*", { count: "exact", head: true })
        .eq("lido", false),
      supabase.from("monitorados").select("*", { count: "exact", head: true }),
      supabase
        .from("alertas")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(5)
        .returns<Alerta[]>(),
      supabase
        .from("monitorados")
        .select("*, ads(*)")
        .order("criado_em", { ascending: false })
        .limit(4)
        .returns<MonitoradoComAd[]>(),
    ]);

  // Contadores derivados do lote ao vivo.
  const escalando = {
    count: lote.filter((a) => a.ativo && a.scale_score >= 71).length,
  };
  const novos = {
    count: lote.filter((a) => (a.data_inicio ?? "") >= seteDias).length,
  };
  const topRes = { data: lote.slice(0, 6) };

  const stats = [
    {
      icon: "🔥",
      value: escalando.count ?? 0,
      label: "Ofertas escalando agora",
      amber: false,
    },
    {
      icon: "👁",
      value: novos.count ?? 0,
      label: "Novos anúncios (7d)",
      amber: false,
    },
    {
      icon: "🔔",
      value: naoLidos.count ?? 0,
      label: "Alertas não lidos",
      amber: true,
    },
    {
      icon: "🎯",
      value: monitorandoCount.count ?? 0,
      label: "No seu radar",
      amber: false,
    },
  ];

  const topAds = topRes.data ?? [];
  const alertas = alertasRes.data ?? [];
  const radar = radarRes.data ?? [];

  return (
    <main className="mx-auto w-full max-w-[1280px] px-8 pb-12 pt-8">
      <div className="mb-7">
        <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.02em] text-zinc-100">
          Fala, {primeiroNome} 👋
        </h1>
        <p className="mt-2 text-[15px] text-zinc-400">
          Isso é o que tá escalando enquanto você dormia.
        </p>
      </div>

      {/* STATS */}
      <div className="mb-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <div className="mb-3.5 flex items-center justify-between">
              <div
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] text-[17px]"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.22)",
                }}
              >
                {s.icon}
              </div>
            </div>
            <div
              className="text-[30px] font-extrabold tracking-[-0.02em] tabular"
              style={{ color: s.amber ? "#f59e0b" : "#f4f4f5" }}
            >
              {s.value}
            </div>
            <div className="mt-1 text-[13px] text-zinc-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* TOP ESCALANDO */}
      <div className="mb-[18px] flex items-center justify-between">
        <h2 className="m-0 text-lg font-bold text-zinc-100">
          Top escalando agora
        </h2>
        <Link href="/ofertas" className="text-[13.5px] font-semibold text-brand">
          ver todas →
        </Link>
      </div>
      {topAds.length > 0 ? (
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topAds.map((ad) => (
            <TopAdCardServer key={ad.id} ad={ad} />
          ))}
        </div>
      ) : (
        <EmptyBox className="mb-10">
          Nenhum anúncio no catálogo ainda. Rode o seed ou faça uma busca.
        </EmptyBox>
      )}

      {/* DUAS COLUNAS */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Alertas recentes */}
        <div className="rounded-2xl border border-line bg-surface p-[22px]">
          <h3 className="m-0 mb-[18px] text-base font-bold text-zinc-100">
            Alertas recentes
          </h3>
          {alertas.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {alertas.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-[10px] py-3 pl-3.5 pr-3"
                  style={{
                    borderLeft: `3px solid ${a.lido ? "#3f3f46" : "#f59e0b"}`,
                    background: a.lido ? "transparent" : "rgba(245,158,11,0.04)",
                  }}
                >
                  <span
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-sm"
                    style={{ background: "rgba(245,158,11,0.14)" }}
                  >
                    {ALERTA_ICON[a.tipo] ?? "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] leading-snug text-zinc-300">
                      {a.titulo ?? "Novo evento no seu radar."}
                    </div>
                    <div className="mt-[3px] text-[11.5px] text-zinc-500">
                      {timeAgo(a.criado_em)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBox>
              Sem alertas ainda. Rastreie páginas em Rastreados & Alertas pra
              começar a receber.
            </EmptyBox>
          )}
        </div>

        {/* Mudanças no radar */}
        <div className="rounded-2xl border border-line bg-surface p-[22px]">
          <h3 className="m-0 mb-[18px] text-base font-bold text-zinc-100">
            Mudanças no seu radar
          </h3>
          {radar.length > 0 ? (
            <div className="flex flex-col gap-3">
              {radar.map((m) => {
                const ad = m.ads;
                const pill = STATUS_PILL[m.status] ?? STATUS_PILL.observando!;
                const de = ad?.variacoes_7d_atras ?? ad?.variacoes_ativas ?? 0;
                const para = ad?.variacoes_ativas ?? 0;
                const up = para >= de;
                return (
                  <Link
                    href={ad ? `/ofertas/${ad.id}` : "/monitorando"}
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl border border-line bg-app p-3 transition-colors hover:border-line-hover"
                  >
                    <div
                      className="h-[42px] w-[42px] shrink-0 rounded-[9px]"
                      style={{
                        background: gradiente(ad?.nicho, ad?.ativo ?? true),
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold text-zinc-100">
                        {ad?.page_name ?? "—"}
                      </div>
                      <div
                        className="mt-[3px] text-[12.5px] font-semibold tabular"
                        style={{ color: up ? "#34d399" : "#f87171" }}
                      >
                        {de} → {para} variações
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-[9px] py-1 text-[11px] font-bold"
                      style={{ color: pill.color, background: pill.bg }}
                    >
                      {pill.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyBox>
              Você ainda não monitora nenhuma oferta. Abra uma oferta e clique
              em “Monitorar”.
            </EmptyBox>
          )}
        </div>
      </div>
    </main>
  );
}

function EmptyBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-xl border border-dashed border-line bg-app px-5 py-6 text-[13px] text-zinc-500" +
        (className ? ` ${className}` : "")
      }
    >
      {children}
    </div>
  );
}

function nomeDe(
  fullName: string | undefined,
  email: string | null | undefined,
): string {
  if (fullName && fullName.trim()) return fullName.trim().split(/\s+/)[0]!;
  const local = (email ?? "").split("@")[0] ?? "";
  const base = local.split(/[.\-_+]/)[0] ?? local;
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "trafegueiro";
}
