import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { Plano } from "@/lib/types/database";
import { SAAS_CATEGORIAS } from "@/lib/saas-categorias";
import { querySaas } from "@/lib/saas";
import { SaasFeed } from "@/components/saas/SaasFeed";
import { cn } from "@/lib/utils";

export const metadata = { title: "Micro-SaaS / SaaS — UmbraAds" };
export const dynamic = "force-dynamic";

const FREE_VISIVEL = 4;

export default async function SaasPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const supabase = await createClient();

  const categoria =
    typeof searchParams.categoria === "string" &&
    SAAS_CATEGORIAS.some((c) => c.key === searchParams.categoria)
      ? searchParams.categoria
      : SAAS_CATEGORIAS[0]!.key;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", user!.id)
    .maybeSingle();
  const plano = ((profile as { plano: Plano } | null)?.plano ?? "free") as Plano;
  const isFree = plano === "free";

  const { ads, nextCursor } = await querySaas(supabase, categoria);
  const visibleAds = isFree ? ads.slice(0, FREE_VISIVEL) : ads;
  const cursor = isFree ? null : nextCursor;

  return (
    <main className="mx-auto w-full max-w-[1320px] px-8 pb-12 pt-7">
      <div className="mb-5">
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-zinc-100">
          Micro-SaaS / SaaS
        </h1>
        <p className="mt-2 text-[15px] text-zinc-400">
          Ofertas mineradas, classificadas por categoria e prontas pra análise
          de mercado.
        </p>
      </div>

      {/* categorias */}
      <div className="mb-6 rounded-[14px] border border-line bg-surface p-4">
        <div className="flex max-h-[132px] flex-wrap gap-2 overflow-y-auto">
          {SAAS_CATEGORIAS.map((c) => {
            const ativo = c.key === categoria;
            return (
              <Link
                key={c.key}
                href={`/saas?categoria=${c.key}`}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                  ativo
                    ? "border-brand bg-brand/15 text-brand-accent"
                    : "border-line bg-app text-zinc-400 hover:border-line-hover hover:text-zinc-200",
                )}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      <SaasFeed
        key={categoria}
        initialAds={visibleAds}
        initialCursor={cursor}
        categoria={categoria}
        locked={isFree}
      />
    </main>
  );
}
