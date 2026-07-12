import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { LIMITES, fmtLimite } from "@/lib/plano";
import type { Plano } from "@/lib/types/database";
import { parseFiltros, filtrosToQuery } from "@/lib/ofertas";
import { queryOfertasLive } from "@/lib/ads-live";
import { FiltersBar } from "@/components/ads/FiltersBar";
import { OfertasFeed } from "@/components/ads/OfertasFeed";

export const metadata = { title: "Ofertas Escaladas — UmbraAds" };

// Sempre dinâmica: depende dos filtros na querystring e da sessão.
export const dynamic = "force-dynamic";

/** Barra de cota de buscas diárias (design: Ofertas). */
async function QuotaBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plano, buscas_hoje")
    .eq("id", user!.id)
    .maybeSingle();

  const p = (profile as { plano: Plano; buscas_hoje: number } | null) ?? {
    plano: "free" as Plano,
    buscas_hoje: 0,
  };
  const limite = LIMITES.buscas[p.plano];
  const ilimitado = !Number.isFinite(limite);
  const pct = ilimitado
    ? 0
    : Math.min(100, Math.round((p.buscas_hoje / Math.max(1, limite)) * 100));

  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl border border-line bg-surface px-[18px] py-3">
      <span className="whitespace-nowrap text-[13px] font-semibold text-zinc-300">
        {ilimitado
          ? `${p.buscas_hoje} buscas hoje · ilimitado`
          : `${p.buscas_hoje}/${fmtLimite(limite)} buscas usadas hoje`}
      </span>
      {!ilimitado ? (
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}
      <Link
        href="/ajustes"
        className="whitespace-nowrap text-[13px] font-bold text-brand"
      >
        Fazer upgrade →
      </Link>
    </div>
  );
}

/** Anúncios visíveis no plano Free antes do bloqueio. */
const FREE_VISIVEL = 4;

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const filtros = parseFiltros(searchParams);

  // plano do usuário → decide se o feed é gated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", user!.id)
    .maybeSingle();
  const plano = ((profile as { plano: Plano } | null)?.plano ?? "free") as Plano;
  const isFree = plano === "free";

  const { ads, nextCursor } = await queryOfertasLive(filtros);

  // Free vê só os primeiros N reais; o resto vira card bloqueado no cliente.
  const visibleAds = isFree ? ads.slice(0, FREE_VISIVEL) : ads;
  const cursor = isFree ? null : nextCursor;

  // querystring dos filtros (sem cursor) para o "Carregar mais" e para
  // remontar o feed quando os filtros mudam.
  const qs = filtrosToQuery(filtros);

  return (
    <main className="mx-auto w-full max-w-[1320px] px-8 pb-12 pt-7">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-zinc-100">
          Ofertas Escaladas
        </h1>
        <p className="mt-2 text-[15px] text-zinc-400">
          O que tá vendendo agora — modele antes que sature.
        </p>
      </div>

      <FiltersBar />

      <QuotaBar />

      <OfertasFeed
        key={qs}
        initialAds={visibleAds}
        initialCursor={cursor}
        filtersQS={qs}
        query={filtros.q}
        pais={filtros.pais}
        locked={isFree}
      />
    </main>
  );
}
