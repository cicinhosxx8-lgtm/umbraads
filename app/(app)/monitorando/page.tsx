import { createClient } from "@/lib/supabase/server";
import { LIMITES, fmtLimite } from "@/lib/plano";
import type { Plano } from "@/lib/types/database";
import {
  MonitoradosView,
  type MonitoradoRow,
} from "@/components/monitorando/MonitoradosView";

export const metadata = { title: "Monitorando — UmbraAds" };
export const dynamic = "force-dynamic";

export default async function MonitorandoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("plano").eq("id", user!.id).maybeSingle(),
    supabase
      .from("monitorados")
      .select("*, ads(*)")
      .order("criado_em", { ascending: false })
      .returns<MonitoradoRow[]>(),
  ]);

  const plano = ((profile as { plano: Plano } | null)?.plano ?? "free") as Plano;
  const monitorados = rows ?? [];
  const limite = LIMITES.monitorados[plano];
  const usados = monitorados.length;
  const pct = Number.isFinite(limite)
    ? Math.min(100, Math.round((usados / Math.max(1, limite)) * 100))
    : 0;

  return (
    <main className="w-full max-w-[1320px] px-8 pb-12 pt-7">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-zinc-100">
            Monitorando
          </h1>
          <p className="mt-2 text-[15px] text-zinc-400">
            A gente re-verifica essas ofertas todo dia. Você só age quando mudar.
          </p>
        </div>
        <div className="w-[220px] shrink-0">
          <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
            <span className="text-zinc-500">Ofertas monitoradas</span>
            <span className="font-bold text-zinc-100 tabular">
              {usados} / {fmtLimite(limite)}
            </span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <MonitoradosView initial={monitorados} />
    </main>
  );
}
