"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/lib/nav";
import { activeNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Item da sidebar. Espelha activeNav/idleNav do design (Dashboard.dc.html):
 * ativo = fundo zinc-800 + texto/ícone amber-500 (semibold);
 * inativo = transparente + zinc-400 (medium), com hover sutil.
 * `collapsed` = só o ícone/emoji (com tooltip do nome).
 */
export function NavLink({
  item,
  collapsed = false,
}: {
  item: NavItem;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const active = activeNav(pathname)?.href === item.href;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[9px] py-2.5 text-sm transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-line font-semibold text-brand"
          : "font-medium text-zinc-400 hover:bg-[#1f1f23] hover:text-zinc-100",
      )}
    >
      <span className="relative inline-flex w-[18px] justify-center">
        {item.icon}
        {collapsed && item.badge ? (
          <span className="absolute -right-2.5 -top-1.5 rounded-full bg-brand px-[5px] text-[9px] font-bold text-app tabular">
            {item.badge}
          </span>
        ) : null}
      </span>
      {!collapsed ? <span>{item.label}</span> : null}
      {!collapsed && item.badge ? (
        <span className="ml-auto rounded-full bg-brand px-[7px] py-px text-[11px] font-bold text-app tabular">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
