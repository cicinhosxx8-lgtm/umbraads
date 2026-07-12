"use client";

import { useState } from "react";

import type { Ad } from "@/lib/types/database";
import { AdCard } from "@/components/ads/AdCard";

/**
 * Grid do feed + "Carregar mais". A 1ª página vem do Server Component (SSR);
 * as próximas são buscadas por cursor em /api/ofertas e ACUMULADAS aqui.
 * A página remonta este componente (key = querystring) quando os filtros mudam.
 */
export function OfertasFeed({
  initialAds,
  initialCursor,
  filtersQS,
}: {
  initialAds: Ad[];
  initialCursor: string | null;
  filtersQS: string;
}) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarMais() {
    if (!cursor || loading) return;
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams(filtersQS);
      params.set("cursor", cursor);
      const res = await fetch(`/api/ofertas?${params.toString()}`);
      if (!res.ok) throw new Error("falha");
      const data: { ads: Ad[]; nextCursor: string | null } = await res.json();
      setAds((prev) => [...prev, ...data.ads]);
      setCursor(data.nextCursor);
    } catch {
      setErro("Não deu pra carregar mais agora. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (ads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <div className="text-[15px] font-semibold text-zinc-300">
          Nenhuma oferta com esses filtros.
        </div>
        <div className="mt-1.5 text-sm text-zinc-500">
          Afrouxa os filtros — tira o mínimo de variações ou aumenta o período.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>

      {erro ? (
        <div className="mt-6 text-center text-[13px] text-bad-soft">{erro}</div>
      ) : null}

      <div className="mt-8 flex justify-center">
        {cursor ? (
          <button
            type="button"
            onClick={carregarMais}
            disabled={loading}
            className="rounded-[10px] border border-line-hover bg-surface px-8 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-[#1f1f23] disabled:opacity-60"
          >
            {loading ? "Carregando…" : "Carregar mais"}
          </button>
        ) : (
          <span className="text-[13px] text-zinc-600">
            Você chegou ao fim do feed.
          </span>
        )}
      </div>
    </>
  );
}
