import Link from "next/link";

/**
 * Placeholder da rota pública "/".
 * A Landing real (Landing.dc.html) é convertida na FASE 5 — por ora
 * esta tela só confirma que o scaffold sobe e dá acesso ao login.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100">
          Umbra<span className="text-brand">Ads</span>
        </h1>
        <p className="mt-3 max-w-md text-zinc-400">
          Espione os anúncios que já escalam no Facebook Ads.
          <br />
          Dados, não achismo.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-app transition-colors hover:bg-brand-hover"
        >
          Entrar
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-line-hover hover:text-zinc-100"
        >
          Dashboard
        </Link>
      </div>

      <p className="text-xs text-zinc-600">
        FASE 1 — Fundação. Landing, telas e motor chegam nas próximas fases.
      </p>
    </main>
  );
}
