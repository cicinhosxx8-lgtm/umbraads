"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { breadcrumbLabel } from "@/lib/nav";

/**
 * Topbar fina — design: Dashboard.dc.html.
 * Breadcrumb à esquerda; sino com contador de alertas + avatar à direita.
 * O avatar abre um menu mínimo (Ajustes / Sair) — o Sair posta em
 * /auth/signout. Contador e iniciais vêm do layout (sessão real).
 */
export function Topbar({
  initials,
  alertasNaoLidos,
}: {
  initials: string;
  alertasNaoLidos: number;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-line bg-app/80 px-[28px] backdrop-blur-[12px]">
      <div className="text-[13.5px] font-medium text-zinc-500">
        <span className="text-zinc-400">UmbraAds</span>
        <span className="px-2">/</span>
        <span className="text-zinc-100">{breadcrumbLabel(pathname)}</span>
      </div>

      <div className="flex items-center gap-[18px]">
        <Link
          href="/rastreados?tab=alertas"
          className="relative"
          aria-label="Alertas"
        >
          <span className="text-[19px]">🔔</span>
          {alertasNaoLidos > 0 ? (
            <span className="absolute -right-[6px] -top-1 rounded-full bg-brand px-[5px] py-px text-[10px] font-extrabold text-app tabular">
              {alertasNaoLidos}
            </span>
          ) : null}
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-line text-[13px] font-bold text-[#fcd34d] transition-colors hover:bg-line-hover"
            aria-label="Menu da conta"
          >
            {initials}
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-[calc(100%+8px)] w-44 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
              <Link
                href="/ajustes"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-zinc-300 hover:bg-line hover:text-zinc-100"
              >
                Ajustes
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="block w-full px-4 py-2 text-left text-sm text-bad-soft hover:bg-line"
                >
                  Sair
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
