"use client";

import { useState } from "react";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "De onde vêm os dados?",
    a: "Direto da Biblioteca de Anúncios da Meta, a base pública de todos os anúncios ativos do Facebook e Instagram. A gente organiza, cruza e pontua esses dados pra você não precisar garimpar na mão.",
  },
  {
    q: "Preciso saber rodar tráfego?",
    a: "Ajuda, mas não é obrigatório. Se você já roda, o UmbraAds encurta seu caminho pra escala. Se está começando, você aprende modelando quem já acertou em vez de queimar verba no chute.",
  },
  {
    q: "Funciona pro meu nicho?",
    a: "Se tem gente anunciando no seu nicho no Brasil, tem dado aqui. Emagrecimento, renda extra, infoproduto, e-commerce, dropshipping, serviço local — filtre e veja o que está escalando.",
  },
  {
    q: "Quantos anúncios entram por dia?",
    a: "Centenas de novas variações são capturadas e re-verificadas diariamente. Nosso monitoramento roda 24/7 pra você nunca ficar pra trás de uma oferta subindo.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelidade, sem multa, sem pegadinha. Cancela com um clique dentro do painel e não é cobrado no próximo ciclo.",
  },
  {
    q: "Tem garantia?",
    a: "Garantia incondicional de 7 dias. Se não fizer sentido pra você, devolvemos 100% do valor sem perguntar nada.",
  },
];

export function Faq() {
  const [aberto, setAberto] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {FAQS.map((f, i) => {
        const open = aberto === i;
        return (
          <div
            key={f.q}
            className="overflow-hidden rounded-xl border border-line bg-surface"
          >
            <button
              type="button"
              onClick={() => setAberto(open ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="text-base font-semibold text-zinc-100">{f.q}</span>
              <span className="shrink-0 text-xl font-bold text-brand">
                {open ? "−" : "+"}
              </span>
            </button>
            {open ? (
              <div className="px-6 pb-[22px] text-[15px] leading-relaxed text-zinc-400">
                {f.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
