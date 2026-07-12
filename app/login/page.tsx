import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar — UmbraAds",
};

/**
 * Rota pública /login. Layout centralizado com o brilho âmbar do design
 * (Login.dc.html). O card interativo (tabs + auth) vive no LoginForm client.
 * O middleware já manda quem tem sessão pra /dashboard.
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; erro?: string };
}) {
  const next =
    typeof searchParams.next === "string" ? searchParams.next : "/dashboard";
  const erro = typeof searchParams.erro === "string" ? searchParams.erro : null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-10">
      {/* brilho amber difuso */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 blur-[40px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(245,158,11,0.16), rgba(245,158,11,0.04) 45%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[420px]">
        <LoginForm next={next} erroInicial={erro} />

        <div className="mt-[22px] px-5 text-center text-xs leading-relaxed text-zinc-500">
          Ao entrar você concorda com os{" "}
          <a href="#" className="text-zinc-400 underline">
            Termos de Uso
          </a>{" "}
          e a{" "}
          <a href="#" className="text-zinc-400 underline">
            Política de Privacidade
          </a>
          .
        </div>
      </div>
    </div>
  );
}
