"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { PLANO_LABEL, fmtLimite } from "@/lib/plano";
import type { Plano, Preferencias } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { dataBR } from "@/lib/format";

type Secao = "conta" | "plano" | "pref" | "sessoes";

const SECOES: Array<{ id: Secao; label: string }> = [
  { id: "conta", label: "Conta" },
  { id: "plano", label: "Plano & Uso" },
  { id: "pref", label: "Preferências" },
  { id: "sessoes", label: "Sessões" },
];

const NICHOS: Array<[string, string]> = [
  ["achadinhos", "Achadinhos"],
  ["beleza", "Beleza"],
  ["pet", "Pet"],
  ["renda extra", "Renda extra"],
  ["casa & cozinha", "Casa & Cozinha"],
];

const PAISES: Array<[string, string]> = [
  ["BR", "Brasil"],
  ["PT", "Portugal"],
  ["US", "Estados Unidos"],
  ["", "Todos os países"],
];

const COMPARE = [
  { feature: "Ofertas monitoradas", pro: "50", elite: "∞" },
  { feature: "Rastreios com alertas", pro: "15", elite: "50" },
  { feature: "Histórico de escala", pro: "90 dias", elite: "Completo" },
  { feature: "Export CSV", pro: "—", elite: "✓" },
];

export interface AjustesProps {
  email: string;
  plano: Plano;
  planoExpiraEm: string | null;
  uso: {
    buscasHoje: number;
    buscasLimite: number;
    monitorados: number;
    monitoradosLimite: number;
    rastreados: number;
    rastreadosLimite: number;
  };
  prefs: Preferencias;
}

export function AjustesView(props: AjustesProps) {
  const [secao, setSecao] = useState<Secao>("plano");

  return (
    <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[200px_1fr]">
      <nav className="sticky top-[84px] flex flex-col gap-[3px]">
        {SECOES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSecao(s.id)}
            className={cn(
              "w-full rounded-[9px] px-3.5 py-2.5 text-left text-sm",
              secao === s.id
                ? "bg-line font-semibold text-brand"
                : "font-medium text-zinc-400 hover:text-zinc-200",
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div>
        {secao === "plano" ? <PlanoUso {...props} /> : null}
        {secao === "conta" ? <Conta email={props.email} /> : null}
        {secao === "pref" ? <Preferenciass prefs={props.prefs} /> : null}
        {secao === "sessoes" ? <Sessoes /> : null}
      </div>
    </div>
  );
}

/* ─────────────────────────── PLANO & USO ─────────────────────────────────── */
function PlanoUso({ plano, planoExpiraEm, uso }: AjustesProps) {
  const barras = [
    {
      label: "Buscas hoje",
      usado: uso.buscasHoje,
      limite: uso.buscasLimite,
    },
    {
      label: "Ofertas monitoradas",
      usado: uso.monitorados,
      limite: uso.monitoradosLimite,
    },
    { label: "Rastreios", usado: uso.rastreados, limite: uso.rastreadosLimite },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      <div
        className="rounded-2xl p-6"
        style={{
          border: "1px solid rgba(245,158,11,0.35)",
          background: "linear-gradient(180deg,rgba(245,158,11,0.05),#18181b)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-[7px] bg-brand px-[11px] py-[3px] text-xs font-extrabold uppercase tracking-[0.05em] text-app">
                {PLANO_LABEL[plano]}
              </span>
              <span className="text-[17px] font-extrabold text-zinc-100">
                Plano {PLANO_LABEL[plano]}
              </span>
            </div>
            <div className="mt-2 text-[13.5px] text-zinc-400">
              {plano === "free"
                ? "Plano gratuito"
                : planoExpiraEm
                  ? `Renova em ${dataBR(planoExpiraEm)}`
                  : "Assinatura ativa"}
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <a
              href="/#planos"
              className="rounded-[9px] bg-brand px-[18px] py-2.5 text-[13.5px] font-bold text-app transition-colors hover:bg-brand-hover"
            >
              Fazer upgrade
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-5 text-[15px] font-bold text-zinc-100">Uso do dia</div>
        <div className="flex flex-col gap-[22px]">
          {barras.map((b) => {
            const inf = !Number.isFinite(b.limite);
            const pct = inf
              ? 100
              : Math.min(100, Math.round((b.usado / Math.max(1, b.limite)) * 100));
            return (
              <div key={b.label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13.5px] text-zinc-400">{b.label}</span>
                  <span
                    className={cn(
                      "text-[13.5px] font-bold tabular",
                      inf ? "text-brand" : "text-zinc-100",
                    )}
                  >
                    {inf ? "∞ ilimitado" : `${b.usado} / ${fmtLimite(b.limite)}`}
                  </span>
                </div>
                <div className="h-[7px] overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-[18px] flex items-center justify-between">
          <div className="text-[15px] font-bold text-zinc-100">Pro vs Elite</div>
          <span className="text-xs font-bold text-zinc-400">
            Você tá no <span className="text-brand">{PLANO_LABEL[plano]}</span>
          </span>
        </div>
        <div className="flex flex-col">
          <div className="grid grid-cols-[1.8fr_1fr_1fr] gap-3 border-b border-line pb-3">
            <span className="text-xs font-bold tracking-[0.03em] text-zinc-500">
              RECURSO
            </span>
            <span className="text-center text-xs font-bold text-zinc-400">Pro</span>
            <span className="text-center text-xs font-extrabold text-brand">
              Elite
            </span>
          </div>
          {COMPARE.map((c) => (
            <div
              key={c.feature}
              className="grid grid-cols-[1.8fr_1fr_1fr] items-center gap-3 border-b border-line py-3"
            >
              <span className="text-[13.5px] text-zinc-300">{c.feature}</span>
              <span className="text-center text-[13px] font-semibold text-zinc-400 tabular">
                {c.pro}
              </span>
              <span className="text-center text-[13px] font-bold text-brand-accent tabular">
                {c.elite}
              </span>
            </div>
          ))}
        </div>
        <a
          href="/#planos"
          className="mt-[18px] block w-full rounded-[10px] bg-brand py-3 text-center text-sm font-bold text-app transition-colors hover:bg-brand-hover"
        >
          Subir pro Elite por R$197/mês
        </a>
      </div>
    </div>
  );
}

/* ─────────────────────────────── CONTA ───────────────────────────────────── */
function Conta({ email }: { email: string }) {
  const [novaSenha, setNovaSenha] = useState("");
  const [msg, setMsg] = useState<{ t: string; erro: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function salvarSenha() {
    if (novaSenha.length < 8) {
      setMsg({ t: "A nova senha precisa ter ao menos 8 caracteres.", erro: true });
      return;
    }
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setBusy(false);
    if (error) setMsg({ t: error.message, erro: true });
    else {
      setNovaSenha("");
      setMsg({ t: "Senha atualizada ✓", erro: false });
    }
  }

  async function excluir() {
    setBusy(true);
    const res = await fetch("/api/conta", { method: "DELETE" });
    if (res.ok) window.location.assign("/login");
    else {
      setBusy(false);
      setMsg({ t: "Não foi possível excluir a conta.", erro: true });
    }
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-[18px] text-[15px] font-bold text-zinc-100">
          Dados da conta
        </div>
        <label className="mb-2 block text-[12.5px] font-semibold text-zinc-400">
          E-mail
        </label>
        <input className="u-in" type="email" value={email} readOnly />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-[18px] text-[15px] font-bold text-zinc-100">
          Alterar senha
        </div>
        <div className="flex max-w-[420px] flex-col gap-3.5">
          <div>
            <label className="mb-2 block text-[12.5px] font-semibold text-zinc-400">
              Nova senha
            </label>
            <input
              className="u-in"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={salvarSenha}
            disabled={busy}
            className="mt-1 self-start rounded-[10px] bg-brand px-[22px] py-[11px] text-[13.5px] font-bold text-app transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            Salvar nova senha
          </button>
          {msg ? (
            <div
              className={cn(
                "text-[13px]",
                msg.erro ? "text-bad-soft" : "text-good-soft",
              )}
            >
              {msg.t}
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          border: "1px solid rgba(239,68,68,0.4)",
          background: "rgba(239,68,68,0.04)",
        }}
      >
        <div className="mb-2 text-[15px] font-bold text-bad-soft">
          Zona de perigo
        </div>
        <p className="m-0 mb-[18px] max-w-[520px] text-[13.5px] leading-relaxed text-zinc-400">
          Excluir sua conta apaga permanentemente seus rastreios, ofertas
          monitoradas e histórico. Não tem volta.
        </p>
        {confirmDel ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={excluir}
              disabled={busy}
              className="rounded-[10px] bg-bad px-5 py-[11px] text-[13.5px] font-bold text-zinc-100 transition-colors hover:bg-bad-soft disabled:opacity-60"
            >
              Confirmar exclusão
            </button>
            <button
              type="button"
              onClick={() => setConfirmDel(false)}
              className="text-[13.5px] font-semibold text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            className="rounded-[10px] border px-5 py-[11px] text-[13.5px] font-bold text-bad-soft transition-colors"
            style={{ borderColor: "rgba(239,68,68,0.5)" }}
          >
            Excluir minha conta
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── PREFERÊNCIAS ────────────────────────────────── */
function Preferenciass({ prefs }: { prefs: Preferencias }) {
  const [pais, setPais] = useState(prefs.pais_padrao ?? "BR");
  const [nichos, setNichos] = useState<string[]>(prefs.nichos ?? []);
  const [msg, setMsg] = useState(false);

  async function salvar(patch: Partial<Preferencias>) {
    await fetch("/api/preferencias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setMsg(true);
    setTimeout(() => setMsg(false), 1500);
  }

  function toggleNicho(id: string) {
    const novo = nichos.includes(id)
      ? nichos.filter((n) => n !== id)
      : [...nichos, id];
    setNichos(novo);
    salvar({ nichos: novo });
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="rounded-2xl border border-line bg-surface p-6">
        <label className="mb-1.5 block text-[15px] font-bold text-zinc-100">
          País padrão das buscas
        </label>
        <p className="m-0 mb-3.5 text-[13px] text-zinc-500">
          Toda busca já abre filtrada por esse país.
        </p>
        <select
          value={pais}
          onChange={(e) => {
            setPais(e.target.value);
            salvar({ pais_padrao: e.target.value });
          }}
          className="min-w-[220px] cursor-pointer appearance-none rounded-[10px] border border-line bg-app px-3.5 py-[11px] text-sm text-zinc-300 outline-none"
        >
          {PAISES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="mb-1.5 text-[15px] font-bold text-zinc-100">
          Nichos favoritos
        </div>
        <p className="m-0 mb-4 text-[13px] text-zinc-500">
          A gente destaca ofertas desses nichos no seu Dashboard.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {NICHOS.map(([id, label]) => {
            const on = nichos.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleNicho(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold",
                  on
                    ? "border-brand text-brand-accent"
                    : "border-line bg-app text-zinc-400",
                )}
                style={on ? { background: "rgba(245,158,11,0.15)" } : undefined}
              >
                {on ? "✓ " : ""}
                {label}
              </button>
            );
          })}
        </div>
        {msg ? (
          <div className="mt-3 text-[12px] text-good-soft">Salvo ✓</div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[14.5px] font-bold text-zinc-100">
                Receber alertas por e-mail
              </span>
              <span
                className="rounded-md border px-2 py-0.5 text-[10.5px] font-bold text-validated-soft"
                style={{
                  background: "rgba(139,92,246,0.14)",
                  borderColor: "rgba(139,92,246,0.35)",
                }}
              >
                Em breve
              </span>
            </div>
            <p className="m-0 mt-1.5 text-[13px] text-zinc-500">
              Um resumo diário do que subiu no seu radar, direto no inbox.
            </p>
          </div>
          <span
            className="relative h-[22px] w-10 shrink-0 cursor-not-allowed rounded-full opacity-50"
            style={{ background: "#3f3f46" }}
          >
            <span className="absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-zinc-400" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── SESSÕES ─────────────────────────────────── */
function Sessoes() {
  const [busy, setBusy] = useState(false);

  async function sairDeTudo() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    window.location.assign("/login");
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-[18px] text-[15px] font-bold text-zinc-100">
        Sessões ativas
      </div>
      <div className="flex items-center gap-3.5 border-b border-line py-3.5">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] bg-line text-base">
          💻
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-zinc-100">
            Este dispositivo
            <span className="ml-1.5 text-[11px] font-bold text-good-soft">
              ● sessão atual
            </span>
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">Navegador ativo agora</div>
        </div>
      </div>
      <p className="mb-3.5 mt-4 text-[13px] text-zinc-500">
        Saiu num computador que não é seu? Encerre todas as sessões em todos os
        dispositivos.
      </p>
      <button
        type="button"
        onClick={sairDeTudo}
        disabled={busy}
        className="rounded-[10px] border border-line-hover px-5 py-[11px] text-[13.5px] font-semibold text-zinc-300 transition-colors hover:border-bad hover:text-bad-soft disabled:opacity-60"
      >
        Sair de todos os dispositivos
      </button>
    </div>
  );
}
