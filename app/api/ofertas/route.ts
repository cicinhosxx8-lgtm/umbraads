import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { parseFiltros, queryOfertas } from "@/lib/ofertas";

/**
 * Feed paginado (lê do banco). Usado pelo botão "Carregar mais" do /ofertas
 * para buscar as próximas páginas por cursor sem recarregar a tela.
 * Reaproveita a MESMA lógica de query do Server Component (lib/ofertas.ts).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const filtros = parseFiltros(request.nextUrl.searchParams);

  try {
    const resultado = await queryOfertas(supabase, filtros);
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar as ofertas." },
      { status: 500 },
    );
  }
}
