import type { Plano } from "@/lib/types/database";
import { NAV_ITEMS } from "@/lib/nav";
import { Logo } from "@/components/brand/Logo";
import { NavLink } from "@/components/shell/NavLink";
import { UpgradeCard } from "@/components/shell/UpgradeCard";

/**
 * Sidebar fixa (~240px) — design: Dashboard.dc.html.
 * Server component: recebe dados do profile/uso via props (do layout).
 * O badge de "Rastreados & Alertas" reflete alertas não lidos.
 */
export function Sidebar({
  plano,
  rastreiosUsados,
  rastreiosLimite,
  alertasNaoLidos,
}: {
  plano: Plano;
  rastreiosUsados: number;
  rastreiosLimite: number;
  alertasNaoLidos: number;
}) {
  const items = NAV_ITEMS.map((item) =>
    item.href === "/rastreados"
      ? { ...item, badge: alertasNaoLidos > 0 ? alertasNaoLidos : null }
      : item,
  );

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-[22px] pb-[18px] pt-[22px] text-[19px]">
        <Logo />
      </div>

      <nav className="flex flex-col gap-[3px] px-3 py-2">
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="mt-auto p-[14px]">
        <UpgradeCard
          plano={plano}
          rastreiosUsados={rastreiosUsados}
          rastreiosLimite={rastreiosLimite}
        />
      </div>
    </aside>
  );
}
