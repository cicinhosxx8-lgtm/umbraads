import Link from "next/link";

import { Logo } from "@/components/brand/Logo";
import { Faq } from "@/components/landing/Faq";

/* Conteúdo (do design Landing.dc.html) */
const SEM = [
  "Testa dezenas de criativos no chute e queima verba antes de achar um que presta.",
  "Descobre tarde demais que a oferta já saturou.",
  "Não sabe se o concorrente está escalando ou só fazendo barulho.",
  "Decisão por achismo, torcida e print de grupo de Telegram.",
];
const COM = [
  "Modela o que JÁ está vendendo e validado no mercado.",
  "Vê o tempo no ar e o histórico de escala antes de investir.",
  "Sabe exatamente quantos criativos cada concorrente roda.",
  "Decisão por dado: Scale Score, variações ativas e crescimento 7d.",
];
const PASSOS = [
  { n: "01", t: "Descubra", d: "Abra o feed de ofertas escaladas e filtre pelo seu nicho. Em segundos você vê o que está bombando." },
  { n: "02", t: "Estude", d: "Copy completa, variações, tempo no ar e histórico de escala de cada anúncio. Dados, não achismo." },
  { n: "03", t: "Modele e lance", d: "Adapte o vencedor pro seu produto e suba com chance real de escalar. Sem queimar verba testando." },
];
const RECURSOS = [
  { icon: "📈", title: "Ofertas escaladas em tempo real", desc: "Veja o que tá bombando agora e quantos criativos cada oferta roda." },
  { icon: "🎯", title: "Scale Score", desc: "Nossa pontuação exclusiva que separa oferta validada de fogo de palha." },
  { icon: "🔄", title: "Monitoramento contínuo", desc: "Marque uma oferta e a gente re-verifica todo dia por você." },
  { icon: "🕵️", title: "Rastreie concorrentes", desc: "Alerta na hora que uma página subir criativo novo." },
  { icon: "🔍", title: "Busca avançada", desc: "Filtre por nicho, país, formato, tempo no ar e nº de variações." },
  { icon: "📊", title: "Histórico de escala", desc: "Gráfico da evolução de anúncios ativos de cada página ao longo do tempo." },
];
const DEPOIMENTOS = [
  { metric: "CPA −31%", quote: "Parei de testar no escuro. Modelei duas ofertas do feed e meu custo por aquisição despencou na primeira semana.", initials: "RM", name: "Rafael Moura", role: "Gestor de tráfego" },
  { metric: "R$ 120k/mês", quote: "Achei um ângulo que ninguém no meu nicho estava usando ainda. Escalei do zero pra seis dígitos por mês.", initials: "JP", name: "Juliana Prado", role: "Infoprodutora" },
  { metric: "8h/semana", quote: "O que a agência levava horas garimpando na biblioteca da Meta, a gente resolve em minutos. Economia real de tempo.", initials: "LC", name: "Lucas Camargo", role: "Sócio de agência" },
  { metric: "3x ROAS", quote: "Modelei o criativo campeão de um gringo, adaptei pro BR e triplicei meu ROAS. Dados, não achismo.", initials: "TS", name: "Thiago Souza", role: "Dropshipper" },
];
const PLANOS = [
  { key: "basico", nome: "Básico", preco: "R$47", sub: "Pra sair do achismo.", destaque: false, feats: ["50 buscas por dia", "15 ofertas monitoradas", "Feed completo de ofertas escaladas"] },
  { key: "pro", nome: "Pro", preco: "R$97", sub: "Pra quem já roda tráfego a sério.", destaque: true, feats: ["Buscas ilimitadas", "50 ofertas monitoradas", "15 rastreios com alertas", "Histórico de escala 90 dias"] },
  { key: "elite", nome: "Elite", preco: "R$147", sub: "Pra agência e operação pesada.", destaque: false, feats: ["Tudo ilimitado", "50 rastreios com alertas", "Export CSV", "Histórico completo", "Acesso antecipado a novos recursos"] },
] as const;

const H2 =
  "text-[38px] font-extrabold leading-[1.1] tracking-[-0.025em] text-zinc-100 m-0";
const KICKER =
  "mb-3 text-[13px] font-bold uppercase tracking-[0.1em] text-brand";

export default function LandingPage() {
  return (
    <div className="w-full overflow-x-hidden bg-app">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-line bg-app/80 backdrop-blur-[12px]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-8 py-4">
          <Logo className="text-xl" />
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#recursos" className="text-zinc-400 hover:text-zinc-100">Recursos</a>
            <a href="#como" className="text-zinc-400 hover:text-zinc-100">Como funciona</a>
            <a href="#planos" className="text-zinc-400 hover:text-zinc-100">Planos</a>
            <a href="#faq" className="text-zinc-400 hover:text-zinc-100">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-zinc-100">
              Entrar
            </Link>
            <Link href="/login" className="rounded-lg bg-brand px-[18px] py-2 text-sm font-semibold text-app transition-colors hover:bg-brand-hover">
              Começar agora
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-[1180px] px-8 pb-16 pt-20">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <div
              className="mb-7 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-brand-accent"
              style={{ border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.06)" }}
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" style={{ animation: "umbraDot 1.8s infinite" }} />
              Biblioteca de anúncios da Meta exposta
            </div>
            <h1 className="m-0 mb-[22px] text-[54px] font-black leading-[1.05] tracking-[-0.03em] text-zinc-100">
              Espione as ofertas que estão <span className="text-brand">ESCALANDO</span> no Facebook agora
            </h1>
            <p className="m-0 mb-8 max-w-[520px] text-[18px] leading-relaxed text-zinc-400">
              Chega de testar criativo no escuro. Veja o que já está vendendo, modele os vencedores e lance campanhas com dados — não com achismo.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link href="/login" className="rounded-[10px] bg-brand px-[26px] py-[15px] text-[15px] font-bold text-app transition-colors hover:bg-brand-hover">
                Quero ver as ofertas
              </Link>
              <a href="#recursos" className="rounded-[10px] border border-line-hover px-[26px] py-[15px] text-[15px] font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100">
                Ver recursos
              </a>
            </div>
            <div className="mt-[22px] text-[13px] font-medium text-zinc-500">
              Garantia de 7 dias &nbsp;•&nbsp; Cancele quando quiser
            </div>
          </div>

          {/* BROWSER MOCKUP */}
          <div className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3.5 border-b border-line bg-surface px-4 py-3">
              <div className="flex gap-[7px]">
                <span className="h-[11px] w-[11px] rounded-full bg-line-hover" />
                <span className="h-[11px] w-[11px] rounded-full bg-line-hover" />
                <span className="h-[11px] w-[11px] rounded-full bg-line-hover" />
              </div>
              <div className="flex-1 rounded-md border border-line bg-app px-3 py-[5px] text-center text-xs text-zinc-500">
                app.umbraads.com.br
              </div>
            </div>
            <div className="bg-app p-[18px]">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[13px] font-bold text-zinc-100">Ofertas Escaladas</div>
                <div className="text-[11px] text-zinc-500">Atualizado agora</div>
              </div>
              <div className="grid gap-3">
                {[
                  { nome: "Emagrece Já — Detox", meta: "54 dias no ar · 31 variações", score: 91, band: "ESCALANDO", dim: false, dot: "#10b981", cor: "#f59e0b" },
                  { nome: "Método Renda Extra", meta: "38 dias no ar · 22 variações", score: 76, band: "ESCALANDO", dim: false, dot: "#10b981", cor: "#f59e0b" },
                  { nome: "Curso Copy 6 em 7", meta: "12 dias no ar · 9 variações", score: 58, band: "AQUECENDO", dim: true, dot: "#fbbf24", cor: "#fbbf24" },
                ].map((c) => (
                  <div key={c.nome} className={"flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5" + (c.dim ? " opacity-70" : "")}>
                    <div className="h-[52px] w-[52px] shrink-0 rounded-lg" style={{ background: "linear-gradient(135deg,#27272a,#3f3f46)" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-100">
                        <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: c.dot }} />
                        {c.nome}
                      </div>
                      <div className="mt-[3px] text-[11px] text-zinc-500">{c.meta}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[22px] font-extrabold tabular" style={{ color: c.cor }}>{c.score}</div>
                      <div className="text-[9px] font-bold tracking-[0.06em]" style={{ color: c.dim ? "#a1a1aa" : "#f59e0b" }}>{c.band}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROVA */}
      <section className="border-y border-line" style={{ background: "#0c0c0e" }}>
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-6 px-8 py-9 md:grid-cols-4">
          {[["2.300+", "anúncios rastreados"], ["480+", "ofertas escaladas"], ["24/7", "monitoramento"], ["100%", "foco no Brasil"]].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="text-[34px] font-extrabold tracking-[-0.02em] text-brand tabular">{n}</div>
              <div className="mt-1 text-[13px] text-zinc-400">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DOR */}
      <section className="mx-auto max-w-[1180px] px-8 py-[88px]">
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <h2 className={H2}>Pare de pagar caro pra descobrir o que <span className="text-bad-soft">não funciona</span>.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-zinc-400">
            Enquanto você queima verba testando criativo no chute, tem gente só modelando o que já escala. A diferença não é sorte — é informação.
          </p>
        </div>
        <div className="mx-auto grid max-w-[900px] grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-7">
            <div className="mb-[18px] text-[13px] font-bold uppercase tracking-[0.06em] text-bad-soft">Sem UmbraAds</div>
            {SEM.map((t) => (
              <div key={t} className="flex items-start gap-3 border-t border-line py-2.5">
                <span className="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-bad-soft" style={{ background: "rgba(239,68,68,0.12)" }}>✕</span>
                <span className="text-[14.5px] leading-normal text-zinc-400">{t}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-7" style={{ border: "1px solid rgba(245,158,11,0.35)", background: "linear-gradient(180deg,rgba(245,158,11,0.05),#18181b)" }}>
            <div className="mb-[18px] text-[13px] font-bold uppercase tracking-[0.06em] text-brand">Com UmbraAds</div>
            {COM.map((t) => (
              <div key={t} className="flex items-start gap-3 border-t border-line py-2.5">
                <span className="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-good-soft" style={{ background: "rgba(16,185,129,0.14)" }}>✓</span>
                <span className="text-[14.5px] leading-normal text-zinc-300">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como" className="mx-auto max-w-[1180px] px-8 py-[88px]">
        <div className="mb-14 text-center">
          <div className={KICKER}>Como funciona</div>
          <h2 className={H2}>Três passos pra sair do escuro</h2>
        </div>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {PASSOS.map((p) => (
            <div key={p.n}>
              <div className="text-[56px] font-black leading-none tracking-[-0.03em] text-brand">{p.n}</div>
              <div className="mb-2.5 mt-4 text-[20px] font-bold text-zinc-100">{p.t}</div>
              <p className="m-0 text-[15px] leading-relaxed text-zinc-400">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="border-t border-line" style={{ background: "#0c0c0e" }}>
        <div className="mx-auto max-w-[1180px] px-8 py-[88px]">
          <div className="mb-14 text-center">
            <div className={KICKER}>Recursos</div>
            <h2 className={H2}>Tudo pra modelar o que já vende</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {RECURSOS.map((r) => (
              <div key={r.title} className="rounded-2xl border border-line bg-surface p-[26px] transition-colors hover:border-line-hover">
                <div className="mb-[18px] flex h-11 w-11 items-center justify-center rounded-[10px] text-brand" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}>{r.icon}</div>
                <div className="mb-2 text-base font-bold text-zinc-100">{r.title}</div>
                <p className="m-0 text-sm leading-relaxed text-zinc-400">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="mx-auto max-w-[1180px] px-8 py-[88px]">
        <div className="mb-14 text-center">
          <div className={KICKER}>Depoimentos</div>
          <h2 className={H2}>Quem parou de chutar</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {DEPOIMENTOS.map((d) => (
            <div key={d.name} className="flex flex-col gap-[18px] rounded-2xl border border-line bg-surface p-7">
              <div className="text-[30px] font-extrabold tracking-[-0.02em] text-brand tabular">{d.metric}</div>
              <p className="m-0 flex-1 text-[15px] leading-relaxed text-zinc-300">&ldquo;{d.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-line text-sm font-bold text-brand-accent">{d.initials}</div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{d.name}</div>
                  <div className="text-[12.5px] text-zinc-500">{d.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="border-t border-line" style={{ background: "#0c0c0e" }}>
        <div className="mx-auto max-w-[1180px] px-8 py-[88px]">
          <div className="mb-14 text-center">
            <div className={KICKER}>Planos</div>
            <h2 className={H2}>Escolha seu nível de vantagem</h2>
          </div>
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3">
            {PLANOS.map((p) => (
              <div
                key={p.nome}
                className="relative rounded-[18px] p-[30px]"
                style={
                  p.destaque
                    ? { border: "1.5px solid #f59e0b", background: "linear-gradient(180deg,rgba(245,158,11,0.06),#18181b)", boxShadow: "0 20px 60px -20px rgba(245,158,11,0.25)" }
                    : { border: "1px solid #27272a", background: "#18181b" }
                }
              >
                {p.destaque ? (
                  <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 rounded-full bg-brand px-3.5 py-[5px] text-[11px] font-extrabold tracking-[0.05em] text-app">
                    POPULAR
                  </div>
                ) : null}
                <div className={"text-[15px] font-bold " + (p.destaque ? "text-brand" : "text-zinc-100")}>{p.nome}</div>
                <div className="mb-1.5 mt-4">
                  <span className="text-[40px] font-extrabold tracking-[-0.02em] text-zinc-100">{p.preco}</span>
                  <span className="text-sm text-zinc-500">/mês</span>
                </div>
                <div className="mb-6 text-[13px] text-zinc-500">{p.sub}</div>
                <Link
                  href={`/api/checkout/${p.key}`}
                  className={
                    "mb-6 block rounded-[10px] py-3 text-center text-sm font-bold transition-colors " +
                    (p.destaque
                      ? "bg-brand text-app hover:bg-brand-hover"
                      : "border border-line-hover text-zinc-300 hover:border-zinc-500 hover:text-zinc-100")
                  }
                >
                  Assinar {p.nome}
                </Link>
                {p.feats.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 py-2 text-sm text-zinc-300">
                    <span className="font-extrabold text-good-soft">✓</span>
                    {f}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-[13px] text-zinc-500">
            Pagamento via Pix, cartão ou boleto &nbsp;•&nbsp; Garantia incondicional de 7 dias
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[820px] px-8 py-[88px]">
        <div className="mb-12 text-center">
          <div className={KICKER}>FAQ</div>
          <h2 className={H2}>Perguntas frequentes</h2>
        </div>
        <Faq />
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-[1180px] px-8 pb-[88px]">
        <div className="rounded-3xl border border-line bg-surface px-10 py-[72px] text-center">
          <h2 className="m-0 mb-3.5 text-[42px] font-black leading-[1.05] tracking-[-0.03em] text-zinc-100">
            Pronto pra parar de <span className="text-brand">queimar verba</span>?
          </h2>
          <p className="m-0 mb-8 text-[18px] text-zinc-400">Entre pro lado dos que escalam com dados.</p>
          <Link href="/login" className="inline-block rounded-xl bg-brand px-[34px] py-[17px] text-base font-bold text-app transition-colors hover:bg-brand-hover">
            Quero meu acesso
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line" style={{ background: "#0c0c0e" }}>
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-10 px-8 pb-10 pt-14 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-3 text-xl" />
            <p className="m-0 max-w-[260px] text-sm leading-relaxed text-zinc-500">
              Inteligência de anúncios pra quem escala.
            </p>
          </div>
          <div>
            <div className="mb-4 text-[13px] font-bold text-zinc-100">Produto</div>
            <div className="flex flex-col gap-2.5 text-sm">
              <a href="#recursos" className="text-zinc-400 hover:text-zinc-100">Recursos</a>
              <a href="#planos" className="text-zinc-400 hover:text-zinc-100">Planos</a>
              <a href="#como" className="text-zinc-400 hover:text-zinc-100">Como funciona</a>
            </div>
          </div>
          <div>
            <div className="mb-4 text-[13px] font-bold text-zinc-100">Suporte</div>
            <div className="flex flex-col gap-2.5 text-sm">
              <a href="#faq" className="text-zinc-400 hover:text-zinc-100">FAQ</a>
              <span className="text-zinc-400">Central de ajuda</span>
              <span className="text-zinc-400">Contato</span>
            </div>
          </div>
          <div>
            <div className="mb-4 text-[13px] font-bold text-zinc-100">Legal</div>
            <div className="flex flex-col gap-2.5 text-sm">
              <span className="text-zinc-400">Termos</span>
              <span className="text-zinc-400">Privacidade</span>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-4 border-t border-line px-8 pb-10 pt-5">
          <div className="text-[12.5px] text-zinc-600">
            Dados públicos da Biblioteca de Anúncios da Meta. Não afiliado à Meta Platforms, Inc.
          </div>
          <div className="text-[12.5px] text-zinc-600">© 2026 UmbraAds. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
