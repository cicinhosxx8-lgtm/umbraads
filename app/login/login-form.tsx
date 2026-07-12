"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

const INPUT_CLASS =
  "w-full rounded-[10px] border border-line bg-app px-[14px] py-3 text-[14.5px] text-zinc-100 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-600 focus:border-brand focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]";

const TAB_BASE =
  "flex-1 rounded-[7px] py-[9px] text-center text-[13.5px] font-semibold transition-colors";

/** Destino seguro pós-login (evita open redirect). */
function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function LoginForm({
  next,
  erroInicial,
}: {
  next: string;
  erroInicial?: string | null;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(
    erroInicial === "auth" ? "Não foi possível autenticar. Tente de novo." : null,
  );
  const [msg, setMsg] = useState<string | null>(null);

  const isLogin = mode === "login";
  const isSignup = !isLogin;
  const destino = safeNext(next);

  function toggleMode(e?: React.MouseEvent) {
    e?.preventDefault();
    setErro(null);
    setMsg(null);
    setMode((m) => (m === "login" ? "signup" : "login"));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
        window.location.assign(destino);
        return;
      }

      // cadastro
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { full_name: nome },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            destino,
          )}`,
        },
      });
      if (error) throw error;

      if (data.session) {
        // Confirmação de e-mail desligada no Supabase → já logou.
        window.location.assign(destino);
        return;
      }
      setMsg("Enviamos um link de confirmação pro seu e-mail. Confere lá! 📩");
    } catch (err) {
      setErro(traduzErro(err));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setErro(null);
    setMsg(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          destino,
        )}`,
      },
    });
    if (error) {
      setErro(traduzErro(error));
      setLoading(false);
    }
    // Sucesso → o browser é redirecionado para o Google.
  }

  async function onReset(e: React.MouseEvent) {
    e.preventDefault();
    setErro(null);
    setMsg(null);
    if (!email) {
      setErro("Digite seu e-mail acima pra receber o link de redefinição.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/ajustes`,
    });
    if (error) setErro(traduzErro(error));
    else setMsg("Se o e-mail existir, enviamos um link pra redefinir a senha.");
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-[36px_34px] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
      <div className="mb-7 text-center text-[22px] font-extrabold tracking-[-0.02em] text-zinc-100">
        Umbra<span className="text-brand">Ads</span>
      </div>

      {/* tabs */}
      <div className="mb-[26px] flex gap-1 rounded-[10px] border border-line bg-app p-1">
        <button
          type="button"
          onClick={() => isSignup && toggleMode()}
          className={cn(
            TAB_BASE,
            isLogin ? "bg-line text-brand" : "bg-transparent text-zinc-500",
          )}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => isLogin && toggleMode()}
          className={cn(
            TAB_BASE,
            isSignup ? "bg-line text-brand" : "bg-transparent text-zinc-500",
          )}
        >
          Criar conta
        </button>
      </div>

      <div className="mb-6 text-center">
        <div className="text-[22px] font-bold tracking-[-0.02em] text-zinc-100">
          {isLogin ? "Bem-vindo de volta" : "Crie sua conta grátis"}
        </div>
        <div className="mt-1.5 text-sm text-zinc-400">
          {isLogin
            ? "Entra aí e vai direto pro feed de ofertas."
            : "Comece a modelar o que já vende hoje mesmo."}
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {isSignup ? (
          <div className="mb-4">
            <label className="mb-[7px] block text-[12.5px] font-semibold text-zinc-400">
              Nome
            </label>
            <input
              className={INPUT_CLASS}
              type="text"
              placeholder="Como te chamam"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
            />
          </div>
        ) : null}

        <div className="mb-4">
          <label className="mb-[7px] block text-[12.5px] font-semibold text-zinc-400">
            E-mail
          </label>
          <input
            className={INPUT_CLASS}
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-2">
          <div className="mb-[7px] flex items-center justify-between">
            <label className="text-[12.5px] font-semibold text-zinc-400">
              Senha
            </label>
            {isLogin ? (
              <a
                href="#"
                onClick={onReset}
                className="text-[12.5px] text-zinc-400 hover:text-zinc-100"
              >
                Esqueci minha senha
              </a>
            ) : null}
          </div>
          <input
            className={INPUT_CLASS}
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </div>

        {erro ? (
          <div className="mt-4 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2.5 text-[13px] text-bad-soft">
            {erro}
          </div>
        ) : null}
        {msg ? (
          <div className="mt-4 rounded-lg border border-good/30 bg-good/10 px-3 py-2.5 text-[13px] text-good-soft">
            {msg}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-[10px] bg-brand py-[13px] text-[15px] font-bold text-app transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Aguarde…"
            : isLogin
              ? "Entrar"
              : "Criar minha conta"}
        </button>
      </form>

      {/* divisor */}
      <div className="my-[22px] flex items-center gap-3.5">
        <div className="h-px flex-1 bg-line" />
        <div className="text-xs font-medium text-zinc-600">ou</div>
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={onGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-line-hover bg-transparent py-3 text-[14.5px] font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-[#1f1f23] disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        Continuar com Google
      </button>

      {/* rodapé */}
      <div className="mt-[26px] text-center text-[13.5px] text-zinc-400">
        {isLogin ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
        <a
          href="#"
          onClick={toggleMode}
          className="font-semibold text-brand hover:text-brand-hover"
        >
          {isLogin ? "Criar conta grátis" : "Fazer login"}
        </a>
      </div>
    </div>
  );
}

/** Mensagens do Supabase → PT-BR amigável. */
function traduzErro(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/User already registered/i.test(msg)) return "Esse e-mail já tem conta. Faça login.";
  if (/Password should be at least/i.test(msg))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (/Email not confirmed/i.test(msg))
    return "Confirme seu e-mail antes de entrar (veja sua caixa de entrada).";
  if (/provider is not enabled/i.test(msg))
    return "Login com Google ainda não está ativado no Supabase.";
  if (/rate limit|too many/i.test(msg))
    return "Muitas tentativas. Espere um pouco e tente de novo.";
  return msg || "Algo deu errado. Tente novamente.";
}
