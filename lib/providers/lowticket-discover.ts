import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type { NormalizedAd } from "@/lib/providers/types";
import { createFacebookProvider } from "@/lib/providers/provider-facebook-adlibrary";
import { upsertAds } from "@/lib/providers/persist";
import { KeysEsgotadasError } from "@/lib/providers/key-manager";
import { seedApiKeys } from "@/lib/providers/api-config";
import { LOWTICKET_CATEGORIAS } from "@/lib/lowticket-categorias";

type Admin = SupabaseClient<Database>;

export interface LowTicketDiscoverResultado {
  categorias: number;
  buscas: number;
  coletados: number;
  novos: number;
  esgotou_cota: boolean;
}

/**
 * Mineração de ofertas Low Ticket. Cada categoria busca seus termos no país do
 * idioma certo (PT→BR, EN→US, Alemão→DE, Japonês→JP). `paises` filtra quais
 * países entram nesta execução.
 */
export async function runLowTicketDiscovery(
  admin: Admin,
  opts: {
    offset?: number;
    count?: number;
    termosPorPais?: number;
    paises?: string[];
  } = {},
): Promise<LowTicketDiscoverResultado> {
  const {
    offset = 0,
    count = 10,
    termosPorPais = 1,
    paises = ["US", "BR", "DE", "JP"],
  } = opts;
  await seedApiKeys(admin); // garante o pool de chaves (env → api_keys)
  const provider = createFacebookProvider(admin);
  const cats = LOWTICKET_CATEGORIAS.slice(offset, offset + count);

  const coletados: NormalizedAd[] = [];
  let buscas = 0;
  let esgotou = false;

  outer: for (const cat of cats) {
    for (const [pais, termos] of Object.entries(cat.buscaPorPais)) {
      if (!paises.includes(pais)) continue;
      for (const termo of termos.slice(0, termosPorPais)) {
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
