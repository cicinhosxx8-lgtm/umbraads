import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

type Admin = SupabaseClient<Database>;

export class KeysEsgotadasError extends Error {
  constructor(provedor: string) {
    super(`Todas as chaves da RapidAPI (${provedor}) estão em cooldown/esgotadas.`);
    this.name = "KeysEsgotadasError";
  }
}

interface KeyRow {
  id: string;
  chave: string;
  uso_atual: number;
  limite_mensal: number | null;
}

/**
 * Gerencia o pool de chaves da RapidAPI (tabela api_keys).
 * - Escolhe a chave 'ativa' com menor uso relativo (uso_atual/limite_mensal).
 * - Reativa chaves cujo cooldown já expirou.
 * - Incrementa uso a cada chamada; em 429 coloca em cooldown por 1h.
 * Só usa a SERVICE ROLE (admin) — nunca exposto ao client.
 */
export class KeyManager {
  constructor(
    private readonly admin: Admin,
    private readonly provedor: string,
  ) {}

  /** Reativa cooldowns expirados e devolve a melhor chave ativa. */
  async pick(): Promise<KeyRow> {
    const agora = new Date().toISOString();

    // reativa cooldowns vencidos
    await this.admin
      .from("api_keys")
      .update({ status: "ativa", cooldown_ate: null } as never)
      .eq("provedor", this.provedor)
      .eq("status", "cooldown")
      .lt("cooldown_ate", agora);

    const { data } = await this.admin
      .from("api_keys")
      .select("id, chave, uso_atual, limite_mensal")
      .eq("provedor", this.provedor)
      .eq("status", "ativa")
      .returns<KeyRow[]>();

    const keys = data ?? [];
    if (keys.length === 0) throw new KeysEsgotadasError(this.provedor);

    // menor uso relativo primeiro (limite nulo = capacidade "infinita")
    keys.sort((a, b) => ratio(a) - ratio(b));
    return keys[0]!;
  }

  async increment(id: string, usoAtual: number): Promise<void> {
    await this.admin
      .from("api_keys")
      .update({ uso_atual: usoAtual + 1 } as never)
      .eq("id", id);
  }

  async cooldown(id: string): Promise<void> {
    const ate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await this.admin
      .from("api_keys")
      .update({ status: "cooldown", cooldown_ate: ate } as never)
      .eq("id", id);
  }

  async esgotar(id: string): Promise<void> {
    await this.admin
      .from("api_keys")
      .update({ status: "esgotada" } as never)
      .eq("id", id);
  }
}

function ratio(k: KeyRow): number {
  return k.limite_mensal && k.limite_mensal > 0
    ? k.uso_atual / k.limite_mensal
    : 0;
}

/**
 * fetch autenticado com rotação de chaves. Tenta até `maxTentativas` chaves:
 * em 429 coloca a atual em cooldown e vai pra próxima; em sucesso incrementa
 * o uso. Lança KeysEsgotadasError se acabarem as chaves.
 */
export async function fetchComChave(
  km: KeyManager,
  host: string,
  url: string,
  maxTentativas = 3,
): Promise<Response> {
  let ultimaResposta: Response | null = null;
  for (let i = 0; i < maxTentativas; i++) {
    const key = await km.pick(); // lança se não houver chave
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": key.chave,
        "X-RapidAPI-Host": host,
      },
    });

    if (res.status === 429) {
      await km.cooldown(key.id);
      ultimaResposta = res;
      continue;
    }

    await km.increment(key.id, key.uso_atual);
    return res;
  }
  // esgotou as tentativas com 429
  if (ultimaResposta) return ultimaResposta;
  throw new KeysEsgotadasError(host);
}
