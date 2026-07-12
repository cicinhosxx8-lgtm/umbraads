import { createClient } from "@/lib/supabase/server";
import { LIMITES } from "@/lib/plano";
import type { Plano, Preferencias } from "@/lib/types/database";
import { AjustesView } from "@/components/ajustes/AjustesView";

export const metadata = { title: "Ajustes — UmbraAds" };
export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, monitorRes, rastRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("plano, plano_expira_em, buscas_hoje, preferencias")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase.from("monitorados").select("*", { count: "exact", head: true }),
    supabase
      .from("rastreados")
      .select("*", { count: "exact", head: true })
      .eq("ativo", true),
  ]);

  const p = (profile as {
    plano: Plano;
    plano_expira_em: string | null;
    buscas_hoje: number;
    preferencias: Preferencias;
  } | null) ?? {
    plano: "free" as Plano,
    plano_expira_em: null,
    buscas_hoje: 0,
    preferencias: {},
  };

  return (
    <main className="mx-auto w-full max-w-[1080px] px-8 pb-12 pt-7">
      <div className="mb-6">
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-zinc-100">
          Ajustes
        </h1>
        <p className="mt-2 text-[15px] text-zinc-400">
          Sua conta, seu plano, do seu jeito.
        </p>
      </div>

      <AjustesView
        email={user?.email ?? ""}
        plano={p.plano}
        planoExpiraEm={p.plano_expira_em}
        uso={{
          buscasHoje: p.buscas_hoje,
          buscasLimite: LIMITES.buscas[p.plano],
          monitorados: monitorRes.count ?? 0,
          monitoradosLimite: LIMITES.monitorados[p.plano],
          rastreados: rastRes.count ?? 0,
          rastreadosLimite: LIMITES.rastreados[p.plano],
        }}
        prefs={p.preferencias ?? {}}
      />
    </main>
  );
}
