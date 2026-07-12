"use client";

import { useState } from "react";
import Link from "next/link";

import type { Ad } from "@/lib/types/database";
import { AdCard } from "@/components/ads/AdCard";
import { LockedCard } from "@/components/ads/LockedCard";

/**
 * Grid do feed Low Ticket + "Carregar mais" (cursor via /api/lowticket).
 * Modo `locked` (Free): 4 reais + N cards bloqueados.
 */
export function LowTicketFeed({
  initialAds,
  initialCursor,
  categoria,
  locked = false,
  lockedCount = 8,
}: {
  initialAds: Ad[];
  initialCursor: string | null;
  categoria: string;
  locked?: boolean;
  lockedCount?: number;
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
      const params = new URLSearchParams({ categoria });
      params.set("cursor", cursor);
      const res = await fetch(`/api/lowticket?${params.toString()}`);
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
          Ainda não mineramos ofertas nessa categoria.
        </div>
        <div className="mt-1.5 text-sm text-zinc-500">
          A mineração roda continuamente — volte em breve ou escolha outra
          categoria.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
        {locked
          ? Array.from({ length: lockedCount }).map((_, i) => (
              <LockedCard key={`locked-${i}`} />
            ))
          : null}
      </div>

      {erro ? (
        <div className="mt-6 text-center text-[13px] text-bad-soft">{erro}</div>
      ) : null}

      {locked ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface px-6 py-8 text-center">
          <div className="text-[17px] font-bold text-zinc-100">
            Você está vendo {ads.length} ofertas Low Ticket no plano Free 🔒
          </div>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Desbloqueie a mineração completa de ofertas Low Ticket por categoria.
          </p>
          <Link
            href="/ajustes"
            className="mt-5 inline-block rounded-[10px] bg-brand px-7 py-3 text-sm font-bold text-app transition-colors hover:bg-brand-hover"
          >
            Assinar e desbloquear tudo
          </Link>
        </div>
      ) : (
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
            <span className="text-[13px] text-zinc-600">Fim da categoria.</span>
          )}
        </div>
      )}
    </>
  );
}
