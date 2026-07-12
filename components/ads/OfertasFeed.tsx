"use client";

import { useState } from "react";
import Link from "next/link";

import type { Ad } from "@/lib/types/database";
import { AdCard } from "@/components/ads/AdCard";
import { LockedCard } from "@/components/ads/LockedCard";

/**
 * Grid do feed + "Carregar mais" + BUSCA AO VIVO.
 * - A 1ª página do feed vem do Server Component (lê do banco); as próximas por
 *   cursor em /api/ofertas.
 * - "Buscar ao vivo" chama /api/search: procura na Meta Ad Library anúncios que
 *   ainda não estão no banco, salva e mostra os resultados aqui.
 * - Modo `locked` (Free): mostra só 4 reais + N cards bloqueados.
 */
export function OfertasFeed({
  initialAds,
  initialCursor,
  filtersQS,
  query = "",
  pais = "",
  locked = false,
  lockedCount = 8,
}: {
  initialAds: Ad[];
  initialCursor: string | null;
  filtersQS: string;
  query?: string;
  pais?: string;
  locked?: boolean;
  lockedCount?: number;
}) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // estado da busca ao vivo (null = mostrando o feed do banco)
  const [liveAds, setLiveAds] = useState<Ad[] | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveErro, setLiveErro] = useState<string | null>(null);

  const isLive = liveAds !== null;
  const displayAds = isLive ? liveAds : ads;
  const shownAds = locked ? displayAds.slice(0, 4) : displayAds;

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

  async function buscarAoVivo() {
    if (!query.trim() || liveLoading) return;
    setLiveLoading(true);
    setLiveErro(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), pais: pais || "BR" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLiveErro(
          data.error ?? "Não foi possível buscar ao vivo agora. Tente de novo.",
        );
        return;
      }
      setLiveAds(data.ads ?? []);
    } catch {
      setLiveErro("Não foi possível buscar ao vivo agora. Tente de novo.");
    } finally {
      setLiveLoading(false);
    }
  }

  function voltarAoFeed() {
    setLiveAds(null);
    setLiveErro(null);
  }

  return (
    <>
      {/* barra de busca ao vivo (só quando há palavra-chave) */}
      {query.trim() ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-[18px] py-3">
          {isLive ? (
            <>
              <span className="text-[13.5px] text-zinc-300">
                <span className="font-semibold text-brand">Ao vivo</span> ·{" "}
                {liveAds!.length} resultado(s) da Meta para &ldquo;{query}&rdquo;
              </span>
              <button
                type="button"
                onClick={voltarAoFeed}
                className="text-[13px] font-semibold text-zinc-400 hover:text-zinc-100"
              >
                ← Voltar ao feed
              </button>
            </>
          ) : (
            <>
              <span className="text-[13.5px] text-zinc-400">
                Não achou no feed? Busque{" "}
                <span className="font-semibold text-zinc-200">
                  &ldquo;{query}&rdquo;
                </span>{" "}
                ao vivo direto na Meta Ad Library.
              </span>
              <button
                type="button"
                onClick={buscarAoVivo}
                disabled={liveLoading}
                className="whitespace-nowrap rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-app transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                {liveLoading ? "Buscando na Meta…" : "⚡ Buscar ao vivo"}
              </button>
            </>
          )}
        </div>
      ) : null}

      {liveErro ? (
        <div className="mb-4 rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-[13px] text-bad-soft">
          {liveErro}
        </div>
      ) : null}

      {/* grid */}
      {shownAds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <div className="text-[15px] font-semibold text-zinc-300">
            {isLive
              ? `Nada encontrado ao vivo para “${query}”.`
              : "Nenhuma oferta com esses filtros."}
          </div>
          <div className="mt-1.5 text-sm text-zinc-500">
            {isLive
              ? "Tente outra palavra-chave ou país."
              : query.trim()
                ? "Tenta a busca ao vivo acima pra trazer anúncios novos da Meta."
                : "Afrouxa os filtros — tira o mínimo de variações ou aumenta o período."}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {shownAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
          {locked
            ? Array.from({ length: lockedCount }).map((_, i) => (
                <LockedCard key={`locked-${i}`} />
              ))
            : null}
        </div>
      )}

      {erro ? (
        <div className="mt-6 text-center text-[13px] text-bad-soft">{erro}</div>
      ) : null}

      {/* rodapé: gate (Free), carregar mais (feed) — some no modo ao vivo */}
      {locked && shownAds.length > 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface px-6 py-8 text-center">
          <div className="text-[17px] font-bold text-zinc-100">
            Você está vendo {shownAds.length} ofertas no plano Free 🔒
          </div>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Desbloqueie o feed completo — todas as ofertas escaladas do Brasil e
            do mundo, atualizadas todo dia.
          </p>
          <Link
            href="/ajustes"
            className="mt-5 inline-block rounded-[10px] bg-brand px-7 py-3 text-sm font-bold text-app transition-colors hover:bg-brand-hover"
          >
            Assinar e desbloquear tudo
          </Link>
        </div>
      ) : !locked && !isLive ? (
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
      ) : null}
    </>
  );
}
