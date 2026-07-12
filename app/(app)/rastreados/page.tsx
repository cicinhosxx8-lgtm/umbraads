import { createClient } from "@/lib/supabase/server";
import { LIMITES } from "@/lib/plano";
import type { Alerta, Plano, Rastreado } from "@/lib/types/database";
import { RastreadosTabs } from "@/components/rastreados/RastreadosTabs";

export const metadata = { title: "Rastreados & Alertas — UmbraAds" };
export const dynamic = "force-dynamic";

const ALERTAS_PAGE = 20;

export default async function RastreadosPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: rastRows }, { data: alertaRows }, naoLidosRes] =
    await Promise.all([
      supabase.from("profiles").select("plano").eq("id", user!.id).maybeSingle(),
      supabase
        .from("rastreados")
        .select("*")
        .order("criado_em", { ascending: false })
        .returns<Rastreado[]>(),
      supabase
        .from("alertas")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(ALERTAS_PAGE + 1)
        .returns<Alerta[]>(),
      supabase
        .from("alertas")
        .select("*", { count: "exact", head: true })
        .eq("lido", false),
    ]);

  const plano = ((profile as { plano: Plano } | null)?.plano ?? "free") as Plano;
  const rastreados = rastRows ?? [];

  const todosAlertas = alertaRows ?? [];
  const hasMore = todosAlertas.length > ALERTAS_PAGE;
  const alertas = hasMore ? todosAlertas.slice(0, ALERTAS_PAGE) : todosAlertas;
  const alertasCursor =
    hasMore && alertas.length > 0
      ? alertas[alertas.length - 1]!.criado_em
      : null;

  const initialTab = searchParams.tab === "alertas" ? "alertas" : "rastreados";

  return (
    <main className="mx-auto w-full max-w-[1120px] px-8 pb-12 pt-7">
      <div className="mb-[22px]">
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-zinc-100">
          Rastreados &amp; Alertas
        </h1>
        <p className="mt-2 text-[15px] text-zinc-400">
          Marque páginas e palavras-chave. A gente te avisa na hora que algo
          subir.
        </p>
      </div>

      <RastreadosTabs
        initialTab={initialTab}
        rastreados={rastreados}
        plano={plano}
        limite={LIMITES.rastreados[plano]}
        alertas={alertas}
        alertasCursor={alertasCursor}
        naoLidos={naoLidosRes.count ?? 0}
      />
    </main>
  );
}
