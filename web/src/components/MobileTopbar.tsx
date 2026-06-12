"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/nav";
import BrandSwitcher from "@/components/BrandSwitcher";
import type { Brand } from "@/lib/brands";

export default function MobileTopbar({ brand }: { brand: Brand }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-12 bg-surface/90 backdrop-blur border-b border-border flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="text-bright text-lg leading-none">☰</button>
        <span className="font-bold text-bright tracking-widest text-sm">▣ VANTAGE</span>
        <span className="ml-auto text-[10px] tracking-widest" style={{ color: brand.color }}>{brand.name.toUpperCase()}</span>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur overflow-y-auto">
          <div className="flex items-center px-4 h-12 border-b border-border">
            <span className="font-bold text-bright tracking-widest text-sm">▣ VANTAGE STUDIO</span>
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="ml-auto text-muted text-lg">✕</button>
          </div>
          <div className="p-4">
            <BrandSwitcher active={brand} collapsed={false} />
            <nav className="mt-4">
              {NAV_GROUPS.map((g) => {
                const items = NAV_ITEMS.filter((i) => i.group === g.id);
                if (items.length === 0) return null;
                return (
                  <div key={g.id} className="mb-3">
                    {g.label && (
                      <div className="text-[9px] tracking-[0.2em] text-dim uppercase mb-1 px-2">{g.label}</div>
                    )}
                    {items.map((item) => {
                      const href = `/${item.slug}`;
                      const active = pathname === href;
                      return (
                        <Link key={item.slug} href={href} onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-2 py-2 text-sm ${active ? "bg-surface-2 text-bright font-semibold" : "text-muted"}`}>
                          <span className="text-accent">{item.icon}</span>
                          {item.label}
                          {item.phase && <span className="ml-auto text-[9px] text-dim">F{item.phase}</span>}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
