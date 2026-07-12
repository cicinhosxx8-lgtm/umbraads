"use client";

import { useEffect, useState } from "react";

import type { Plano } from "@/lib/types/database";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { NavLink } from "@/components/shell/NavLink";
import { UpgradeCard } from "@/components/shell/UpgradeCard";

const STORAGE_KEY = "umbra-sidebar-collapsed";

// Outros produtos Umbra (links externos, abrem em nova aba).
const EXTERNOS = [
  { label: "Umbra Copywriter", href: "https://umbracopywriter.com/#/", icon: "✍️" },
  { label: "Umbra Bot", href: "https://www.umbrabot.com.br", icon: "🤖" },
];

/**
 * Sidebar fixa (~240px) — design: Dashboard.dc.html.
 * Recolhível: o botão fecha/abre; fechada mostra só os ícones/emojis (com
 * tooltip do nome). O estado fica salvo no localStorage.
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const items = NAV_ITEMS.map((item) =>
    item.href === "/rastreados"
      ? { ...item, badge: alertasNaoLidos > 0 ? alertasNaoLidos : null }
      : item,
  );

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      {/* topo: logo */}
      <div
        className={cn(
          "flex items-center pb-[18px] pt-[22px]",
          collapsed ? "justify-center px-2" : "px-[22px]",
        )}
      >
        {collapsed ? (
          <span className="text-[19px] font-extrabold tracking-[-0.02em] text-zinc-100">
            U<span className="text-brand">A</span>
          </span>
        ) : (
          <Logo className="text-[19px]" />
        )}
      </div>

      {/* nav */}
      <nav
        className={cn(
          "flex flex-col gap-[3px] py-2",
          collapsed ? "px-2.5" : "px-3",
        )}
      >
        {items.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* rodapé: outros produtos + card de upgrade (só aberta) + recolher */}
      <div className={cn("mt-auto", collapsed ? "p-2.5" : "p-[14px]")}>
        <div className="mb-2.5 flex flex-col gap-1.5">
          {EXTERNOS.map((p) => (
            <a
              key={p.href}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              title={collapsed ? p.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-[9px] border border-line bg-app text-[13px] font-semibold text-zinc-300 transition-colors hover:border-brand hover:text-brand",
                collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
              )}
            >
              <span className="text-base leading-none">{p.icon}</span>
              {!collapsed ? (
                <>
                  <span>{p.label}</span>
                  <span className="ml-auto text-zinc-600">↗</span>
                </>
              ) : null}
            </a>
          ))}
        </div>

        {!collapsed ? (
          <div className="mb-2.5">
            <UpgradeCard
              plano={plano}
              rastreiosUsados={rastreiosUsados}
              rastreiosLimite={rastreiosLimite}
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className={cn(
            "flex w-full items-center gap-2 rounded-[9px] border border-line py-2 text-[13px] font-semibold text-zinc-400 transition-colors hover:border-line-hover hover:text-zinc-100",
            collapsed ? "justify-center px-0" : "px-3",
          )}
        >
          <span className="text-base leading-none">{collapsed ? "»" : "«"}</span>
          {!collapsed ? <span>Recolher</span> : null}
        </button>
      </div>
    </aside>
  );
}
