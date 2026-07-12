/**
 * Navegação do app shell (sidebar). Ícones em glyph/emoji EXATAMENTE como no
 * design (Dashboard.dc.html), para fidelidade visual. `match` define quais
 * pathnames marcam o item como ativo.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** prefixos de rota que ativam este item */
  match: string[];
  /** contador opcional (ex.: alertas não lidos) — injetado em runtime */
  badge?: string | number | null;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "▚", match: ["/dashboard"] },
  { label: "Ofertas Escaladas", href: "/ofertas", icon: "🔥", match: ["/ofertas"] },
  { label: "Micro-SaaS / SaaS", href: "/saas", icon: "🧩", match: ["/saas"] },
  { label: "Low Ticket", href: "/lowticket", icon: "🏷️", match: ["/lowticket"] },
  { label: "Monitorando", href: "/monitorando", icon: "👁", match: ["/monitorando"] },
  { label: "Rastreados & Alertas", href: "/rastreados", icon: "🎯", match: ["/rastreados"] },
  { label: "Ajustes", href: "/ajustes", icon: "⚙", match: ["/ajustes"] },
];

/** Item ativo para um dado pathname (o de match mais específico vence). */
export function activeNav(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) =>
    item.match.some((m) => pathname === m || pathname.startsWith(m + "/")),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

/** Rótulo do breadcrumb da topbar para um pathname. */
export function breadcrumbLabel(pathname: string): string {
  return activeNav(pathname)?.label ?? "UmbraAds";
}
