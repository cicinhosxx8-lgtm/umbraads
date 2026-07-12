import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Ad, PageSnapshot, Page } from "@/lib/types/database";
import { dataBR, formatCriativo, gradientFor, paisFlag } from "@/lib/format";
import { ScaleBandBadge } from "@/components/ads/ScaleBadge";
import { StatusDot } from "@/components/ads/StatusDot";
import { AdCreative } from "@/components/ads/AdCreative";
import { EvolucaoChart } from "@/components/ads/EvolucaoChart";
import { CopyButton } from "@/components/ads/CopyButton";
import { VariacoesStrip } from "@/components/ads/VariacoesStrip";
import { MiniAdCard } from "@/components/ads/MiniAdCard";
import { DetailActions } from "@/components/ads/DetailActions";

export const dynamic = "force-dynamic";

export default async function DetalheAnuncioPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: adData } = await supabase
    .from("ads")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  const ad = adData as Ad | null;
  if (!ad) notFound();

  // Dados relacionados: snapshots (gráfico), página (cabeçalho), mais anúncios,
  // e o estado do usuário (já monitora esta oferta? já rastreia a página?).
  const [
    { data: snapsData },
    { data: pageData },
    { data: maisData },
    { data: monitoradoData },
    { data: rastreadoData },
  ] = await Promise.all([
    supabase
      .from("page_snapshots")
      .select("*")
      .eq("page_id", ad.page_id)
      .order("data", { ascending: true })
      .returns<PageSnapshot[]>(),
    supabase.from("pages").select("*").eq("page_id", ad.page_id).maybeSingle(),
    supabase
      .from("ads")
      .select("*")
      .eq("page_id", ad.page_id)
      .neq("id", ad.id)
      .order("scale_score", { ascending: false })
      .limit(4)
      .returns<Ad[]>(),
    supabase.from("monitorados").select("id").eq("ad_id", ad.id).maybeSingle(),
    supabase
      .from("rastreados")
      .select("id")
      .eq("tipo", "pagina")
      .eq("valor", ad.page_id)
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  const snapshots = snapsData ?? [];
  const page = pageData as Page | null;
  const maisAds = maisData ?? [];
  const monitoradoId = (monitoradoData as { id: string } | null)?.id ?? null;
  const rastreadoId = (rastreadoData as { id: string } | null)?.id ?? null;

  // Crescimento da página no período (primeiro vs último snapshot).
  const crescimento = (() => {
    if (snapshots.length < 2) return null;
    const first = snapshots[0]!.anuncios_ativos ?? 0;
    const last = snapshots[snapshots.length - 1]!.anuncios_ativos ?? 0;
    if (first <= 0) return null;
    return Math.round(((last - first) / first) * 100);
  })();

  const varSemana =
    ad.variacoes_7d_atras != null
      ? ad.variacoes_ativas - ad.variacoes_7d_atras
      : null;

  const gradient = gradientFor(ad.nicho, ad.ativo);

  const infoRows: Array<[string, React.ReactNode]> = [
    ["CTA do anúncio", ad.cta ?? "—"],
    [
      "Landing page",
      ad.link_destino ? (
        <a
          href={ad.link_destino}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:text-brand-hover"
        >
          {hostDe(ad.link_destino)} ↗
        </a>
      ) : (
        "—"
      ),
    ],
    ["Idioma", (ad.idioma ?? "PT").toUpperCase() === "PT" ? "PT-BR" : ad.idioma],
    ["Formato", formatCriativo(ad.tipo_criativo).replace(/^[^ ]+ /, "")],
    ["Nicho", ad.nicho ? capitalize(ad.nicho) : "—"],
    ["Primeira veiculação", dataBR(ad.data_inicio)],
  ];

  return (
    <main className="w-full max-w-[1320px] px-8 pb-12 pt-7">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* ======= COLUNA ESQUERDA ======= */}
        <div className="flex flex-col gap-5">
          {/* criativo (toca vídeo de verdade) */}
          <AdCreative ad={ad} />

          {/* variações */}
          <div className="rounded-2xl border border-line bg-surface p-[18px]">
            <div className="mb-3.5 text-sm font-bold text-zinc-100">
              Variações ativas{" "}
              <span className="font-semibold text-zinc-500">
                ({ad.variacoes_ativas})
              </span>
            </div>
            <VariacoesStrip total={ad.variacoes_ativas} gradient={gradient} />
          </div>

          {/* evolução */}
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-zinc-100">
                  Evolução da página
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  Anúncios ativos · últimos 60 dias
                </div>
              </div>
              {crescimento != null ? (
                <span
                  className="text-xs font-bold"
                  style={{ color: crescimento >= 0 ? "#34d399" : "#f87171" }}
                >
                  {crescimento >= 0 ? "↑ +" : "↓ "}
                  {crescimento}%
                </span>
              ) : null}
            </div>
            <EvolucaoChart snapshots={snapshots} />
          </div>
        </div>

        {/* ======= COLUNA DIREITA ======= */}
        <div className="flex flex-col gap-[18px]">
          {/* cabeçalho página */}
          <div className="flex items-center gap-3.5">
            <div
              className="h-12 w-12 shrink-0 rounded-xl"
              style={{ background: gradient }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-lg font-extrabold tracking-[-0.01em] text-zinc-100">
                {ad.page_name ?? "Página"}
              </div>
              <div className="mt-1">
                <StatusDot
                  ativo={ad.ativo}
                  label={
                    ad.ativo
                      ? `Ativo há ${diasDesde(page?.primeiro_visto) ?? ad.dias_ativo ?? 0} dias`
                      : "Página inativa"
                  }
                />
              </div>
            </div>
            <Link
              href={`/ofertas?q=${encodeURIComponent(ad.page_name ?? "")}`}
              className="whitespace-nowrap text-[12.5px] font-semibold text-brand"
            >
              Ver todos da página →
            </Link>
          </div>

          {/* métricas destaque */}
          <div
            className="rounded-2xl p-6"
            style={{
              border: "1px solid rgba(245,158,11,0.35)",
              background:
                "linear-gradient(180deg,rgba(245,158,11,0.06),#18181b)",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-[64px] font-black leading-[0.9] tracking-[-0.03em] text-brand tabular">
                {ad.scale_score}
              </div>
              <div>
                <div className="mb-1.5 text-[11px] font-bold tracking-[0.06em] text-zinc-400">
                  SCALE SCORE
                </div>
                <ScaleBandBadge score={ad.scale_score} />
              </div>
            </div>
            <div className="mt-[22px] grid grid-cols-3 gap-3 border-t border-line pt-5">
              <div>
                <div className="text-xl font-extrabold text-zinc-100 tabular">
                  {ad.variacoes_ativas}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500">
                  variações ativas
                </div>
                {varSemana != null && varSemana > 0 ? (
                  <div className="mt-[3px] text-[11px] font-bold text-good-soft">
                    ↑ +{varSemana} esta semana
                  </div>
                ) : null}
              </div>
              <div>
                <div className="text-xl font-extrabold text-zinc-100 tabular">
                  {ad.dias_ativo ?? 0}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500">dias no ar</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-zinc-100">
                  {paisFlag(ad.pais)}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500">país</div>
              </div>
            </div>
          </div>

          {/* copy */}
          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <div className="text-sm font-bold text-zinc-100">
                Copy do anúncio
              </div>
              <CopyButton text={ad.copy_texto ?? ""} />
            </div>
            <p className="m-0 whitespace-pre-line text-sm leading-[1.65] text-zinc-300">
              {ad.copy_texto ?? "Sem copy capturada."}
            </p>
          </div>

          {/* info */}
          <div className="rounded-2xl border border-line bg-surface px-5 py-1.5">
            {infoRows.map(([label, value], i) => (
              <div
                key={label}
                className={
                  "flex items-center justify-between gap-3 py-3" +
                  (i < infoRows.length - 1 ? " border-b border-line" : "")
                }
              >
                <span className="text-[12.5px] text-zinc-500">{label}</span>
                <span className="text-right text-[13px] font-semibold text-zinc-100">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* ações */}
          <DetailActions
            adId={ad.id}
            pageId={ad.page_id}
            initialMonitoradoId={monitoradoId}
            initialRastreadoId={rastreadoId}
          />
        </div>
      </div>

      {/* ======= MAIS DESTA PÁGINA ======= */}
      {maisAds.length > 0 ? (
        <div className="mt-10">
          <div className="mb-[18px] text-lg font-bold text-zinc-100">
            Mais anúncios desta página
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {maisAds.map((a) => (
              <MiniAdCard key={a.id} ad={a} />
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function hostDe(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function diasDesde(ts: string | null | undefined): number | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}
