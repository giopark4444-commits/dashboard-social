"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/nav";
import BrandSwitcher from "@/components/BrandSwitcher";
import type { Brand } from "@/lib/brands";

export default function Sidebar({ updatedAt, brand }:
  { updatedAt: string | null; brand: Brand }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-60"} shrink-0 overflow-hidden bg-surface border-r border-border ${collapsed ? "px-2 py-4" : "p-4"} flex flex-col min-h-screen transition-[width] duration-200`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expandir menú" : "Encoger menú"}
        className={`mb-3 rounded-lg py-1 text-dim hover:bg-surface-2 hover:text-muted text-sm ${collapsed ? "w-full text-center" : "self-end px-2"}`}
      >
        {collapsed ? "»" : "«"}
      </button>

      {!collapsed && (
        <div className="mb-3">
          <div className="font-bold text-bright tracking-widest text-sm">▣ VANTAGE STUDIO</div>
          <div className="text-[10px] text-dim tracking-widest">
            {updatedAt ? `ACTUALIZADO ${updatedAt}` : "SIN DATOS AÚN"}
          </div>
        </div>
      )}

      <div className="mb-4">
        <BrandSwitcher active={brand} collapsed={collapsed} />
      </div>

      <nav className="flex-1 flex flex-col text-sm">
        {NAV_GROUPS.map((g) => {
          const items = NAV_ITEMS.filter((i) => i.group === g.id);
          if (items.length === 0) return null;
          return (
            <div key={g.id} style={g.id === "sistema" ? { marginTop: "auto" } : undefined}>
              {!collapsed && g.label && (
                <div className="text-[9px] tracking-[0.2em] text-dim uppercase mt-3 mb-1 px-3">
                  {g.label}
                </div>
              )}
              {items.map((item) => {
                const href = `/${item.slug}`;
                const active = pathname === href;
                return (
                  <Link key={item.slug} href={href} title={item.label}
                    className={`flex items-center rounded-lg py-1.5 mb-0.5 ${
                      collapsed ? "justify-center px-0" : "gap-2 px-3"
                    } ${
                      active ? "bg-surface-2 font-semibold text-bright"
                             : "text-muted hover:bg-surface-2"}`}>
                    <span className="text-base leading-none shrink-0 text-accent">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.phase && (
                      <span className="ml-auto text-[9px] text-dim">F{item.phase}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
