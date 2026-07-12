import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { cronAutorizado } from "@/lib/cron";
import type { Ad, AlertaTipo } from "@/lib/types/database";
import { createFacebookProvider } from "@/lib/providers/provider-facebook-adlibrary";
import { upsertAds, writePageSnapshot } from "@/lib/providers/persist";
import { computeScaleScore } from "@/lib/providers/scale-score";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAGES = 100; // teto de segurança por execução

type Admin = ReturnType<typeof createAdminClient>;
type NovoAlerta = {
  user_id: string;
  rastreado_id: string | null;
  tipo: AlertaTipo;
  titulo: string;
  payload: Record<string, unknown>;
};

/**
 * Cron diário (06:00 UTC). Re-verifica ofertas monitoradas/páginas rastreadas,
 * recalcula Scale Score, grava snapshots do dia, gera alertas e atualiza o
 * status dos monitorados. Resiliente: se o provider estiver indisponível,
 * ainda recalcula e faz snapshot a partir dos dados do banco.
 */
export async function GET(request: NextRequest) {
  if (!cronAutorizado(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const provider = createFacebookProvider(admin);
  const hoje = new Date().toISOString().slice(0, 10);
  const alertas: NovoAlerta[] = [];

  // ── páginas rastreadas (ativas) → user(s) por página ──────────────────────
  const { data: rastreados } = await admin
    .from("rastreados")
    .select("id, user_id, valor")
    .eq("ativo", true)
    .eq("tipo", "pagina")
    .returns<{ id: string; user_id: string; valor: string }[]>();

  const porPagina = new Map<
    string,
    Array<{ id: string; user_id: string }>
  >();
  for (const r of rastreados ?? []) {
    const arr = porPagina.get(r.valor) ?? [];
    arr.push({ id: r.id, user_id: r.user_id });
    porPagina.set(r.valor, arr);
  }

  let paginasProcessadas = 0;
  let provOk = true;

  for (const [pageId, trackers] of porPagina) {
    if (paginasProcessadas >= MAX_PAGES) break;
    paginasProcessadas++;

    // archive ids já conhecidos desta página (p/ detectar anúncios novos)
    const { data: antes } = await admin
      .from("ads")
      .select("ad_archive_id")
      .eq("page_id", pageId)
      .returns<{ ad_archive_id: string }[]>();
    const conhecidos = new Set((antes ?? []).map((a) => a.ad_archive_id));

    try {
      const { ads } = await provider.getPageAds(pageId);
      await upsertAds(admin, ads);
      const ativos = ads.filter((a) => a.ativo).length;
      await writePageSnapshot(admin, pageId, ativos, hoje);

      const novos = ads.filter((a) => !conhecidos.has(a.ad_archive_id));
      if (novos.length > 0) {
        const nome = novos[0]!.page_name ?? pageId;
        for (const t of trackers) {
          alertas.push({
            user_id: t.user_id,
            rastreado_id: t.id,
            tipo: "novo_anuncio",
            titulo: `🔔 '${nome}' subiu ${novos.length} anúncio(s) novo(s)`,
            payload: { page_id: pageId, page_name: nome, novos: novos.length },
          });
        }
      }
    } catch {
      // provider indisponível → snapshot a partir do banco
      provOk = false;
      const { count } = await admin
        .from("ads")
        .select("*", { count: "exact", head: true })
        .eq("page_id", pageId)
        .eq("ativo", true);
      await writePageSnapshot(admin, pageId, count ?? 0, hoje);
    }
  }

  // ── monitorados: status + alertas de explosão/morte ───────────────────────
  const { data: monitorados } = await admin
    .from("monitorados")
    .select("id, user_id, ad_id, status, ads(*)")
    .returns<
      Array<{
        id: string;
        user_id: string;
        ad_id: string;
        status: string;
        ads: Ad | null;
      }>
    >();

  let statusAtualizados = 0;
  for (const m of monitorados ?? []) {
    const ad = m.ads;
    if (!ad) continue;

    // novo status derivado do estado do anúncio
    const novoStatus = !ad.ativo
      ? "morta"
      : (ad.dias_ativo ?? 0) >= 30
        ? "validada"
        : "observando";
    if (novoStatus !== m.status) {
      await admin
        .from("monitorados")
        .update({ status: novoStatus } as never)
        .eq("id", m.id);
      statusAtualizados++;
    }

    const v7 = ad.variacoes_7d_atras;
    // explosão: variações ≥ 2x em 7 dias
    if (v7 && v7 > 0 && ad.variacoes_ativas >= 2 * v7) {
      alertas.push({
        user_id: m.user_id,
        rastreado_id: null,
        tipo: "explosao_variacoes",
        titulo: `🚀 '${ad.page_name ?? "Oferta"}' explodiu: ${v7} → ${ad.variacoes_ativas} variações`,
        payload: { ad_id: ad.id, de: v7, para: ad.variacoes_ativas },
      });
    }
    // morta: ficou inativa OU variações caíram >50%
    if (!ad.ativo || (v7 && v7 > 0 && ad.variacoes_ativas < v7 * 0.5)) {
      alertas.push({
        user_id: m.user_id,
        rastreado_id: null,
        tipo: "oferta_morta",
        titulo: `💀 Oferta '${ad.page_name ?? "—"}' foi ao chão`,
        payload: { ad_id: ad.id, de: v7, para: ad.variacoes_ativas },
      });
    }
  }

  const alertasInseridos = await inserirAlertasNovos(admin, alertas, hoje);

  // ── rotação semanal de variacoes_7d_atras (segundas) ──────────────────────
  let rotacionados = 0;
  if (new Date().getUTCDay() === 1) {
    rotacionados = await rotacionar7d(admin);
  }

  return NextResponse.json({
    ok: true,
    provider_ok: provOk,
    paginas: paginasProcessadas,
    status_atualizados: statusAtualizados,
    alertas: alertasInseridos,
    rotacao_7d: rotacionados,
  });
}

/** Insere apenas alertas que ainda não existem hoje (evita duplicar no dia). */
async function inserirAlertasNovos(
  admin: Admin,
  alertas: NovoAlerta[],
  hoje: string,
): Promise<number> {
  if (alertas.length === 0) return 0;

  const { data: existentes } = await admin
    .from("alertas")
    .select("user_id, tipo, payload")
    .gte("criado_em", `${hoje}T00:00:00Z`)
    .returns<{ user_id: string; tipo: string; payload: Record<string, unknown> | null }[]>();

  const chave = (a: {
    user_id: string;
    tipo: string;
    payload: Record<string, unknown> | null;
  }) => `${a.user_id}|${a.tipo}|${a.payload?.ad_id ?? a.payload?.page_id ?? ""}`;

  const jaExiste = new Set((existentes ?? []).map(chave));
  const novos = alertas.filter((a) => !jaExiste.has(chave(a)));
  if (novos.length === 0) return 0;

  await admin.from("alertas").insert(novos as never);
  return novos.length;
}

/** Fecha a janela de 7 dias: variacoes_7d_atras := variacoes_ativas (e reScore). */
async function rotacionar7d(admin: Admin): Promise<number> {
  const { data } = await admin
    .from("ads")
    .select("id, variacoes_ativas, dias_ativo")
    .returns<{ id: string; variacoes_ativas: number; dias_ativo: number | null }[]>();
  const rows = data ?? [];
  for (const r of rows) {
    await admin
      .from("ads")
      .update({
        variacoes_7d_atras: r.variacoes_ativas,
        scale_score: computeScaleScore({
          variacoesAtivas: r.variacoes_ativas,
          variacoes7dAtras: r.variacoes_ativas,
          diasAtivo: r.dias_ativo,
        }),
      } as never)
      .eq("id", r.id);
  }
  return rows.length;
}
