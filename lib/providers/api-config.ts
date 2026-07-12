import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

type Admin = SupabaseClient<Database>;

// ════════════════════════════════════════════════════════════════════════════
// CONFIG DAS 3 APIs de Ad Library no RapidAPI.
// A rotação é DUPLA:
//   1) entre as N chaves (RAPIDAPI_KEY_1..N) dentro de cada API  (KeyManager)
//   2) entre as 3 APIs, em ordem de prioridade                   (MultiProvider)
// Prioridade = maior cota primeiro (api4 200 → scraper3 100 → pages 25); api4
// também tem a melhor cobertura de criativo, então é a preferida.
// ════════════════════════════════════════════════════════════════════════════
export interface ApiConfig {
  /** chave lógica — casa com api_keys.provedor. */
  provedor: string;
  host: string;
  /** cota mensal por chave (marketplace). */
  limiteMensal: number;
  /** ordem de tentativa (menor = tenta primeiro). */
  prioridade: number;
  /** endpoint de busca por keyword/page_id. */
  searchPath: string;
  /** endpoint de detalhe profundo de um anúncio. */
  detailPath: string;
  /** nome do parâmetro de paginação (cursor vs end_cursor). */
  cursorParam: "cursor" | "end_cursor";
}

export const API_CONFIGS: ApiConfig[] = [
  {
    provedor: "facebook-scraper-api4",
    host: "facebook-scraper-api4.p.rapidapi.com",
    limiteMensal: 200,
    prioridade: 1,
    searchPath: "/fetch_search_ads_pages",
    detailPath: "/fetch_archive_ad_details",
    cursorParam: "end_cursor" as const,
  },
  {
    provedor: "facebook-scraper3",
    host: "facebook-scraper3.p.rapidapi.com",
    limiteMensal: 100,
    prioridade: 2,
    searchPath: "/ads/search",
    detailPath: "/ads/details",
    cursorParam: "cursor" as const,
  },
  {
    provedor: "facebook-pages-scraper2",
    host: "facebook-pages-scraper2.p.rapidapi.com",
    limiteMensal: 25,
    prioridade: 3,
    searchPath: "/fetch_search_ads_pages",
    detailPath: "/fetch_archive_ad_details",
    cursorParam: "end_cursor" as const,
  },
].sort((a, b) => a.prioridade - b.prioridade);

/**
 * Lê o pool de chaves da RapidAPI do ambiente: RAPIDAPI_KEY_1, RAPIDAPI_KEY_2…
 * Aceita até 30 (varremos folgado). Faz fallback para RAPIDAPI_KEY (legado).
 * Dedup + trim. NUNCA hardcoded no código — só via env (Vercel/.env.local).
 */
export function getRapidApiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 30; i++) {
    const v = process.env[`RAPIDAPI_KEY_${i}`];
    if (v && v.trim()) keys.push(v.trim());
  }
  const single = process.env.RAPIDAPI_KEY;
  if (single && single.trim()) keys.push(single.trim());
  return [...new Set(keys)];
}

export interface SeedResultado {
  chaves: number;
  provedores: number;
  inseridas: number;
}

/**
 * Semeia (idempotente) o pool api_keys a partir das chaves do env: para cada
 * uma das 3 APIs × cada chave, garante uma linha (provedor, chave) com o
 * limite mensal correto. Preserva uso/cooldown das linhas já existentes e só
 * insere o que falta. Também reativa chaves cujo cooldown já venceu, para dar
 * partida limpa. Chamado no início de toda descoberta.
 */
export async function seedApiKeys(admin: Admin): Promise<SeedResultado> {
  const chaves = getRapidApiKeys();
  const base: SeedResultado = {
    chaves: chaves.length,
    provedores: API_CONFIGS.length,
    inseridas: 0,
  };
  if (chaves.length === 0) return base;

  const { data: existentes } = await admin
    .from("api_keys")
    .select("provedor, chave")
    .returns<{ provedor: string; chave: string }[]>();

  const jaTem = new Set(
    (existentes ?? []).map((r) => `${r.provedor}|${r.chave}`),
  );

  const novas: Database["public"]["Tables"]["api_keys"]["Insert"][] = [];
  for (const cfg of API_CONFIGS) {
    for (const chave of chaves) {
      if (!jaTem.has(`${cfg.provedor}|${chave}`)) {
        novas.push({
          provedor: cfg.provedor,
          chave,
          limite_mensal: cfg.limiteMensal,
          uso_atual: 0,
          status: "ativa",
        });
      }
    }
  }

  if (novas.length > 0) {
    await admin.from("api_keys").insert(novas as never);
  }

  // reativa cooldowns já vencidos (partida limpa a cada descoberta)
  await admin
    .from("api_keys")
    .update({ status: "ativa", cooldown_ate: null } as never)
    .eq("status", "cooldown")
    .lt("cooldown_ate", new Date().toISOString());

  return { ...base, inseridas: novas.length };
}
