"use client";
import { useRouter } from "next/navigation";
import { BRANDS, BRAND_COOKIE, type Brand } from "@/lib/brands";

export default function BrandSwitcher({ active, collapsed }:
  { active: Brand; collapsed: boolean }) {
  const router = useRouter();

  function onChange(id: string) {
    document.cookie = `${BRAND_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  if (collapsed) {
    return (
      <div title={active.name}
        className="w-8 h-8 mx-auto rounded-lg border border-border flex items-center justify-center text-xs font-bold"
        style={{ color: active.color }}>
        {active.name[0]}
      </div>
    );
  }

  return (
    <select value={active.id} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-sm text-bright">
      {BRANDS.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}
