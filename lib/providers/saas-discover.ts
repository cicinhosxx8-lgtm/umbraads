import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type { NormalizedAd } from "@/lib/providers/types";
import { createFacebookProvider } from "@/lib/providers/provider-facebook-adlibrary";
import { upsertAds } from "@/lib/providers/persist";
import { KeysEsgotadasError } from "@/lib/providers/key-manager";
import { seedApiKeys } from "@/lib/providers/api-config";
import { SAAS_CATEGORIAS } from "@/lib/saas-categorias";

type Admin = SupabaseClient<Database>;

export interface SaasDiscoverResultado {
  categorias: number;
  buscas: number;
  coletados: number;
  novos: number;
  esgotou_cota: boolean;
}

/**
 * Mineração de anúncios SaaS/Micro-SaaS. Varre um recorte de categorias e
 * busca os termos de cada uma na Ad Library (US + BR), fazendo upsert. Os
 * anúncios são classificados por palavra-chave no momento da query (lib/saas).
 */
export async function runSaasDiscovery(
  admin: Admin,
  opts: {
    offset?: number;
    count?: number;
    termosPorCat?: number;
    paises?: string[];
  } = {},
): Promise<SaasDiscoverResultado> {
  const { offset = 0, count = 12, termosPorCat = 1, paises = ["US"] } = opts;
  await seedApiKeys(admin); // garante o pool de chaves (env → api_keys)
  const provider = createFacebookProvider(admin);
  const cats = SAAS_CATEGORIAS.slice(offset, offset + count);

  const coletados: NormalizedAd[] = [];
  let buscas = 0;
  let esgotou = false;

  outer: for (const cat of cats) {
    for (const termo of cat.busca.slice(0, termosPorCat)) {
      for (const pais of paises) {
        try {
          const { ads } = await provider.searchAds({
            query: termo,
            pais,
            ativo: "active",
          });
          coletados.push(...ads);
          buscas++;
        } catch (e) {
          if (e instanceof KeysEsgotadasError) {
            esgotou = true;
            break outer;
          }
          // erro pontual não derruba o resto
        }
      }
    }
  }

  const unicos = new Map(coletados.map((a) => [a.ad_archive_id, a]));
  const ids = await upsertAds(admin, [...unicos.values()]);

  return {
    categorias: cats.length,
    buscas,
    coletados: coletados.length,
    novos: ids.length,
    esgotou_cota: esgotou,
  };
}
