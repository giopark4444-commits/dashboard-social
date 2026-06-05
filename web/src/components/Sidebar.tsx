"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

export default function Sidebar({ updatedAt }: { updatedAt: string | null }) {
  const pathname = usePathname();
  const groups = [1, 2, 3] as const;
  return (
    <aside className="w-56 shrink-0 bg-stone-100 border-r border-stone-200 p-4 flex flex-col min-h-screen">
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-full bg-stone-300 mx-auto mb-2" />
        <div className="font-bold text-stone-800">Gio</div>
        <div className="text-xs text-stone-400">
          {updatedAt ? `Actualizado ${updatedAt}` : "Sin datos aún"}
        </div>
        <div className="inline-block bg-yellow-100 text-yellow-800 text-xs rounded-full px-2 py-0.5 mt-1">
          ★ Score —/100
        </div>
      </div>
      <nav className="flex-1 flex flex-col text-sm">
        {groups.map((g) => (
          <div key={g} className={g > 1 ? "border-t border-dashed border-stone-300 mt-2 pt-2" : ""}
            style={g === 3 ? { marginTop: "auto" } : undefined}>
            {NAV_ITEMS.filter((i) => i.group === g).map((item) => {
              const href = `/${item.slug}`;
              const active = pathname === href;
              return (
                <Link key={item.slug} href={href}
                  className={`block rounded-lg px-3 py-1.5 mb-0.5 ${
                    active ? "bg-white font-semibold text-stone-900 shadow-sm"
                           : "text-stone-500 hover:bg-stone-200"}`}>
                  {item.emoji} {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
