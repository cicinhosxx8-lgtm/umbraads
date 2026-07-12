import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LIMITES } from "@/lib/plano";
import type { Plano } from "@/lib/types/database";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

/** Iniciais para o avatar a partir do e-mail. */
function iniciais(email: string | null | undefined): string {
  if (!email) return "U";
  const nome = email.split("@")[0] ?? "";
  const partes = nome.split(/[.\-_+]/).filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0]![0]! + partes[1]![0]!).toUpperCase();
  }
  return nome.slice(0, 2).toUpperCase() || "U";
}

/**
 * Layout das telas protegidas: guard de sessão + app shell (sidebar + topbar).
 * O middleware já redireciona sem sessão; aqui reforçamos e carregamos os
 * dados reais do usuário (plano, uso de rastreios, alertas não lidos).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sem env do Supabase (setup ainda não feito) → manda pro /login, que
  // renderiza sem depender de sessão.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect("/login");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Plano do usuário (profile criado pelo trigger no signup).
  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", user.id)
    .maybeSingle();

  const plano: Plano =
    (profile as { plano: Plano } | null)?.plano ?? "free";

  // Uso de rastreios (ativos) e alertas não lidos — para sidebar/topbar.
  const [{ count: rastreiosUsados }, { count: alertasNaoLidos }] =
    await Promise.all([
      supabase
        .from("rastreados")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true),
      supabase
        .from("alertas")
        .select("*", { count: "exact", head: true })
        .eq("lido", false),
    ]);

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar
        plano={plano}
        rastreiosUsados={rastreiosUsados ?? 0}
        rastreiosLimite={LIMITES.rastreados[plano]}
        alertasNaoLidos={alertasNaoLidos ?? 0}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          initials={iniciais(user.email)}
          alertasNaoLidos={alertasNaoLidos ?? 0}
        />
        {children}
      </div>
    </div>
  );
}
