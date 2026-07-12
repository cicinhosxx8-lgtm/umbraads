import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type { NormalizedAd } from "@/lib/providers/types";
import { createFacebookProvider } from "@/lib/providers/provider-facebook-adlibrary";
import { upsertAds } from "@/lib/providers/persist";
import { KeysEsgotadasError } from "@/lib/providers/key-manager";
import { seedApiKeys } from "@/lib/providers/api-config";

type Admin = SupabaseClient<Database>;
type QN = [query: string, nicho: string];

// keywords por idioma (o provider não classifica nicho — usamos a keyword)
const PT: QN[] = [
  ["fritadeira", "achadinhos"],
  ["air fryer", "casa & cozinha"],
  ["organizador de casa", "casa & cozinha"],
  ["emagrecedor", "beleza"],
  ["sérum facial", "beleza"],
  ["tapete higiênico pet", "pet"],
  ["ração cachorro", "pet"],
  ["renda extra", "renda extra"],
  ["ganhar dinheiro online", "renda extra"],
  ["achadinhos", "achadinhos"],
];
const EN: QN[] = [
  ["air fryer", "casa & cozinha"],
  ["weight loss", "beleza"],
  ["skincare", "beleza"],
  ["make money online", "renda extra"],
  ["dog toys", "pet"],
  ["home gadgets", "achadinhos"],
  ["kitchen gadgets", "casa & cozinha"],
  ["fitness", "beleza"],
];
const ES: QN[] = [
  ["freidora de aire", "casa & cozinha"],
  ["adelgazar", "beleza"],
  ["ganar dinero", "renda extra"],
  ["juguetes para perros", "pet"],
];

// BR + gringos: cada país com o idioma certo.
const MATRIZ: Array<{ country: string; queries: QN[] }> = [
  { country: "BR", queries: PT },
  { country: "US", queries: EN },
  { country: "GB", queries: EN },
  { country: "PT", queries: PT },
  { country: "ES", queries: ES },
  { country: "MX", queries: ES },
];

const COMBOS: Array<[string, string, string]> = MATRIZ.flatMap((m) =>
  m.queries.map(([q, n]) => [m.country, q, n] as [string, string, string]),
);

export interface DiscoverResultado {
  combos: number;
  coletados: number;
  novos: number;
  por_pais: Record<string, number>;
  esgotou_cota: boolean;
}

/**
 * Descoberta automática: varre a matriz país×keyword, busca anúncios reais e
 * faz upsert. Enche o feed sozinho com BR + internacionais. Chamado pelo cron
 * diário de refresh e pela rota /api/cron/discover.
 */
export async function runDiscovery(admin: Admin): Promise<DiscoverResultado> {
  await seedApiKeys(admin); // garante o pool de chaves (env → api_keys)
  const provider = createFacebookProvider(admin);
  const coletados: NormalizedAd[] = [];
  const porPais: Record<string, number> = {};
  let combos = 0;
  let esgotou = false;

  for (const [country, query, nicho] of COMBOS) {
    try {
      const { ads } = await provider.searchAds({
        query,
        pais: country,
        ativo: "active",
      });
      for (const ad of ads) {
        ad.nicho = nicho;
        coletados.push(ad);
      }
      porPais[country] = (porPais[country] ?? 0) + ads.length;
      combos++;
    } catch (e) {
      if (e instanceof KeysEsgotadasError) {
        esgotou = true;
        break;
      }
      // erro pontual de uma keyword não derruba o resto
    }
  }

  const unicos = new Map(coletados.map((a) => [a.ad_archive_id, a]));
  const ids = await upsertAds(admin, [...unicos.values()]);

  return {
    combos,
    coletados: coletados.length,
    novos: ids.length,
    por_pais: porPais,
    esgotou_cota: esgotou,
  };
}
