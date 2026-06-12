# Fase 1 "Metamorfosis" — Vantage Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el repo dashboard-social en Vantage Studio: rebrand + tema command-center, navegación agrupada con selector de marca, modelo multi-marca en Supabase, Dashboard con KPIs y panel de Agentes básico.

**Architecture:** App Next.js 16 existente en `web/` (App Router, Supabase SSR, Tailwind v4, deploy Vercel). Se agrega tabla `brands` + `agent_settings` + `agent_runs` en el Supabase existente (ref `dhjkrrokvovlxmiuihxm`); la marca activa vive en una cookie que leen los server components. Spec: `docs/superpowers/specs/2026-06-12-vantage-studio-design.md`.

**Tech Stack:** Next.js 16.2.7, React 19, Tailwind v4 (tokens `@theme`), Supabase (`@supabase/ssr`), Vitest.

**Reglas del repo (web/AGENTS.md):** Este Next.js NO es el de los datos de entrenamiento — leer `node_modules/next/dist/docs/` ante cualquier duda. Gotchas conocidos: `proxy.ts` en vez de middleware, `params` es Promise, regla lint `react-hooks/purity` con `Date.now()`.

**Directorio de trabajo:** `/Users/usuario/Desktop/social dashboard/web` (los comandos `npm` se corren ahí).

---

### Task 1: Migración multi-marca en Supabase

**Files:**
- Create: `web/supabase/migrations/0002_vantage_brands.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- 0002: Vantage Studio — marcas/workspaces + agentes

-- marcas (workspaces)
create table public.brands (
  id text primary key,              -- slug estable usado por la app
  name text not null,
  color text not null default '#4f8cff',
  position int not null default 0
);
alter table public.brands enable row level security;
create policy "authenticated_read_brands"
  on public.brands for select to authenticated using (true);

insert into public.brands (id, name, color, position) values
  ('personal', 'Marca Personal', '#4f8cff', 1),
  ('vendalo',  'Vendalo',        '#25d366', 2),
  ('oriole',   'Oriole 1060',    '#f0b429', 3),
  ('bar1060',  '1060 Bar',       '#e4573d', 4),
  ('clientes', 'Clientes',       '#a06bfa', 5);

-- snapshots pasa a ser por marca (lo existente era de la marca personal)
alter table public.snapshots
  add column brand_id text not null default 'personal' references public.brands(id);
alter table public.snapshots
  drop constraint snapshots_platform_snapshot_date_key;
alter table public.snapshots
  add constraint snapshots_brand_platform_date_key unique (brand_id, platform, snapshot_date);

-- autonomía y reglas por agente y por marca
create table public.agent_settings (
  agent_id text not null,
  brand_id text not null references public.brands(id),
  autonomy text not null default 'manual'
    check (autonomy in ('manual','copiloto','auto')),
  rules jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (agent_id, brand_id)
);
alter table public.agent_settings enable row level security;
create policy "authenticated_all_agent_settings"
  on public.agent_settings for all to authenticated
  using (true) with check (true);

-- bitácora de agentes (escriben los agentes vía service role; el usuario lee)
create table public.agent_runs (
  id bigint generated always as identity primary key,
  agent_id text not null,
  brand_id text references public.brands(id),
  action text not null,
  status text not null default 'ok' check (status in ('ok','error','pending')),
  detail jsonb not null default '{}'::jsonb,
  cost_usd numeric(8,4),
  created_at timestamptz not null default now()
);
alter table public.agent_runs enable row level security;
create policy "authenticated_read_agent_runs"
  on public.agent_runs for select to authenticated using (true);
```

- [ ] **Step 2: Aplicar la migración al proyecto Supabase**

Usar el MCP de Supabase: `mcp__plugin_supabase_supabase__apply_migration` con `project_id: dhjkrrokvovlxmiuihxm`, `name: vantage_brands`, y el SQL de arriba como `query`.
(Alternativa manual: pegar el SQL en el SQL Editor del dashboard de Supabase.)

- [ ] **Step 3: Verificar**

Usar `mcp__plugin_supabase_supabase__list_tables` (project_id `dhjkrrokvovlxmiuihxm`).
Esperado: aparecen `brands` (5 filas), `agent_settings`, `agent_runs`, y `snapshots` tiene columna `brand_id`.

- [ ] **Step 4: Commit**

```bash
git add web/supabase/migrations/0002_vantage_brands.sql
git commit -m "feat: migración multi-marca (brands, agent_settings, agent_runs)"
```

---

### Task 2: Librería de marcas

**Files:**
- Create: `web/src/lib/brands.ts` (puro, testeable)
- Create: `web/src/lib/brands-server.ts` (lee cookie, solo server)
- Test: `web/src/lib/__tests__/brands.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from "vitest";
import { BRANDS, DEFAULT_BRAND_ID, resolveBrandId, getBrand } from "@/lib/brands";

describe("brands", () => {
  it("tiene las 5 marcas con ids únicos", () => {
    expect(BRANDS).toHaveLength(5);
    expect(new Set(BRANDS.map((b) => b.id)).size).toBe(5);
  });

  it("resolveBrandId valida slugs y cae a personal", () => {
    expect(resolveBrandId("vendalo")).toBe("vendalo");
    expect(resolveBrandId("hacker")).toBe(DEFAULT_BRAND_ID);
    expect(resolveBrandId(undefined)).toBe(DEFAULT_BRAND_ID);
    expect(resolveBrandId(null)).toBe(DEFAULT_BRAND_ID);
  });

  it("getBrand devuelve la marca o personal", () => {
    expect(getBrand("oriole").name).toBe("Oriole 1060");
    expect(getBrand("nope").id).toBe(DEFAULT_BRAND_ID);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test`
Expected: FAIL — "Cannot find module '@/lib/brands'" (o equivalente).

- [ ] **Step 3: Implementar `web/src/lib/brands.ts`**

```ts
export type Brand = { id: string; name: string; color: string };

// Debe coincidir con la tabla public.brands (migración 0002)
export const BRANDS: Brand[] = [
  { id: "personal", name: "Marca Personal", color: "#4f8cff" },
  { id: "vendalo",  name: "Vendalo",        color: "#25d366" },
  { id: "oriole",   name: "Oriole 1060",    color: "#f0b429" },
  { id: "bar1060",  name: "1060 Bar",       color: "#e4573d" },
  { id: "clientes", name: "Clientes",       color: "#a06bfa" },
];

export const DEFAULT_BRAND_ID = "personal";
export const BRAND_COOKIE = "vantage_brand";

/** valida un slug de marca; cae a personal si no existe */
export function resolveBrandId(raw: string | undefined | null): string {
  return BRANDS.some((b) => b.id === raw) ? (raw as string) : DEFAULT_BRAND_ID;
}

export function getBrand(id: string): Brand {
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0];
}
```

- [ ] **Step 4: Implementar `web/src/lib/brands-server.ts`**

(Separado de brands.ts para que los tests no importen `next/headers`.)

```ts
import { cookies } from "next/headers";
import { BRAND_COOKIE, getBrand, resolveBrandId, type Brand } from "@/lib/brands";

/** Marca activa según cookie; personal por defecto. Solo server components/routes. */
export async function getActiveBrand(): Promise<Brand> {
  const store = await cookies();
  return getBrand(resolveBrandId(store.get(BRAND_COOKIE)?.value));
}
```

- [ ] **Step 5: Correr tests**

Run: `npm test`
Expected: PASS (los 3 nuevos + los existentes de snapshots/youtube).

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/brands.ts web/src/lib/brands-server.ts web/src/lib/__tests__/brands.test.ts
git commit -m "feat: catálogo de marcas + marca activa por cookie"
```

---

### Task 3: Catálogo de agentes

**Files:**
- Create: `web/src/lib/agents.ts`
- Test: `web/src/lib/__tests__/agents.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from "vitest";
import { AGENTS, mergeAgentSettings, type AgentSettingRow } from "@/lib/agents";

describe("mergeAgentSettings", () => {
  it("combina catálogo con filas de settings, default manual", () => {
    const rows: AgentSettingRow[] = [
      { agent_id: "cmo", brand_id: "personal", autonomy: "auto" },
    ];
    const merged = mergeAgentSettings(rows);
    expect(merged).toHaveLength(AGENTS.length);
    expect(merged.find((a) => a.id === "cmo")!.autonomy).toBe("auto");
    expect(merged.find((a) => a.id === "trend-scout")!.autonomy).toBe("manual");
  });

  it("ignora filas de agentes que ya no existen en el catálogo", () => {
    const merged = mergeAgentSettings([
      { agent_id: "fantasma", brand_id: "personal", autonomy: "auto" },
    ]);
    expect(merged.every((a) => a.autonomy === "manual")).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test`
Expected: FAIL — "Cannot find module '@/lib/agents'".

- [ ] **Step 3: Implementar `web/src/lib/agents.ts`**

```ts
export type Autonomy = "manual" | "copiloto" | "auto";
export const AUTONOMY_LEVELS: Autonomy[] = ["manual", "copiloto", "auto"];

export type AgentDef = { id: string; name: string; module: string; desc: string };

// Catálogo estático; la autonomía por marca vive en public.agent_settings
export const AGENTS: AgentDef[] = [
  { id: "cmo",            name: "CMO Agent",      module: "Centro",       desc: "Cerebro: Daily Brief, chat y coordinación (Fase 2)" },
  { id: "hook-hunter",    name: "Hook Hunter",    module: "Contenido",    desc: "Variantes y clasificación de hooks (Fase 4)" },
  { id: "carrusel-writer",name: "Carrusel Writer",module: "Contenido",    desc: "Escribe slides de carruseles (Fase 4)" },
  { id: "trend-scout",    name: "Trend Scout",    module: "Contenido",    desc: "Rastreo de tendencias en el runner (Fase 5)" },
  { id: "prospector",     name: "Prospector",     module: "Crecimiento",  desc: "Enriquecimiento de prospects (Fase 6)" },
  { id: "auditor",        name: "Auditor",        module: "Inteligencia", desc: "Auditorías de canal completas (Fase 7)" },
];

export type AgentSettingRow = { agent_id: string; brand_id: string; autonomy: Autonomy };
export type AgentWithSettings = AgentDef & { autonomy: Autonomy };

/** Catálogo + settings de la marca activa; sin fila ⇒ manual. */
export function mergeAgentSettings(rows: AgentSettingRow[]): AgentWithSettings[] {
  return AGENTS.map((a) => ({
    ...a,
    autonomy: rows.find((r) => r.agent_id === a.id)?.autonomy ?? "manual",
  }));
}
```

- [ ] **Step 4: Correr tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/agents.ts web/src/lib/__tests__/agents.test.ts
git commit -m "feat: catálogo de agentes con autonomía graduable"
```

---

### Task 4: Navegación nueva (5 grupos + 18 módulos)

**Files:**
- Modify: `web/src/lib/nav.ts` (reemplazo completo)
- Test: `web/src/lib/__tests__/nav.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from "vitest";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/nav";

describe("nav", () => {
  it("slugs únicos", () => {
    const slugs = NAV_ITEMS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todo item pertenece a un grupo declarado", () => {
    const groups = NAV_GROUPS.map((g) => g.id);
    expect(NAV_ITEMS.every((i) => groups.includes(i.group))).toBe(true);
  });

  it("dashboard es la raíz y agentes existe", () => {
    expect(NAV_ITEMS.find((i) => i.slug === "")!.label).toBe("Dashboard");
    expect(NAV_ITEMS.some((i) => i.slug === "agentes")).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test`
Expected: FAIL — `NAV_GROUPS` no existe / shape distinto.

- [ ] **Step 3: Reemplazar `web/src/lib/nav.ts` completo**

```ts
export type NavGroupId = "centro" | "canales" | "crecimiento" | "contenido" | "inteligencia" | "sistema";
export type NavGroupDef = { id: NavGroupId; label: string };

export const NAV_GROUPS: NavGroupDef[] = [
  { id: "centro",       label: "Centro" },
  { id: "canales",      label: "Canales" },
  { id: "crecimiento",  label: "Crecimiento" },
  { id: "contenido",    label: "Contenido" },
  { id: "inteligencia", label: "Inteligencia" },
  { id: "sistema",      label: "" }, // grupo inferior sin título
];

// phase = fase del spec en la que el módulo cobra vida; sin phase ⇒ vive desde la Fase 1
export type NavItem = { slug: string; label: string; icon: string; group: NavGroupId; phase?: number };

export const NAV_ITEMS: NavItem[] = [
  { slug: "",            label: "Dashboard",        icon: "◈", group: "centro" },
  { slug: "brief",       label: "Daily Brief",      icon: "☀", group: "centro",       phase: 2 },
  { slug: "inbox",       label: "Inbox",            icon: "✉", group: "centro",       phase: 6 },
  { slug: "youtube",     label: "YouTube",          icon: "▶", group: "canales",      phase: 2 },
  { slug: "instagram",   label: "Instagram",        icon: "◎", group: "canales",      phase: 7 },
  { slug: "meta-ads",    label: "Meta Ads",         icon: "▣", group: "canales",      phase: 7 },
  { slug: "whatsapp",    label: "Bot WhatsApp",     icon: "✆", group: "canales",      phase: 5 },
  { slug: "prospeccion", label: "Prospección",      icon: "⌖", group: "crecimiento",  phase: 6 },
  { slug: "ventas",      label: "Ventas",           icon: "↗", group: "crecimiento",  phase: 6 },
  { slug: "calendario",  label: "Content Calendar", icon: "▦", group: "contenido",    phase: 4 },
  { slug: "carrusel",    label: "Carrusel Studio",  icon: "❏", group: "contenido",    phase: 4 },
  { slug: "hooks",       label: "Hook Bank",        icon: "⚓", group: "contenido",    phase: 4 },
  { slug: "trends",      label: "Trend Scout",      icon: "≈", group: "contenido",    phase: 5 },
  { slug: "video",       label: "Video Analysis",   icon: "◬", group: "contenido",    phase: 4 },
  { slug: "audits",      label: "Audit Inbox",      icon: "✓", group: "inteligencia", phase: 7 },
  { slug: "skills",      label: "Skills Library",   icon: "✦", group: "inteligencia", phase: 2 },
  { slug: "agentes",     label: "Agentes",          icon: "⌬", group: "inteligencia" },
  { slug: "jarvis",      label: "Jarvis HUD",       icon: "◉", group: "inteligencia", phase: 3 },
  { slug: "ajustes",     label: "Ajustes",          icon: "⚙", group: "sistema",      phase: 2 },
];

export const SECTION_SLUGS = NAV_ITEMS.map((i) => i.slug).filter(Boolean);
```

- [ ] **Step 4: Correr tests**

Run: `npm test`
Expected: PASS los de nav. (Si `[section]/page.tsx` rompe el type-check por `PHASE_BY_SLUG`, se arregla en Task 8 — vitest no type-checkea, así que no bloquea.)

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/nav.ts web/src/lib/__tests__/nav.test.ts
git commit -m "feat: navegación Vantage — 5 grupos, 18 módulos, fases"
```

---

### Task 5: Tema command-center + rebrand de layout y login

**Files:**
- Modify: `web/src/app/globals.css` (reemplazo completo)
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/login/page.tsx`

- [ ] **Step 1: Reemplazar `globals.css`**

```css
@import "tailwindcss";

:root {
  --background: #070b14;
  --surface: #0d1426;
  --surface-2: #16213c;
  --border: #1e2a45;
  --foreground: #cfe0ff;
  --bright: #e8f0ff;
  --muted: #8fa3c8;
  --dim: #3d527d;
  --accent: #4f8cff;
  --ok: #5fd08a;
  --warn: #d0b85f;
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-border: var(--border);
  --color-foreground: var(--foreground);
  --color-bright: var(--bright);
  --color-muted: var(--muted);
  --color-dim: var(--dim);
  --color-accent: var(--accent);
  --color-ok: var(--ok);
  --color-warn: var(--warn);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
```

Esto habilita clases Tailwind: `bg-surface`, `bg-surface-2`, `border-border`, `text-bright`, `text-muted`, `text-dim`, `text-accent`, `text-ok`, `text-warn`, etc.

- [ ] **Step 2: Actualizar `layout.tsx`**

Cambios: título, clases del body, y pasar la marca activa al Sidebar (el Sidebar nuevo de Task 6 recibe `brand`):

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";

export const metadata: Metadata = { title: "Vantage Studio" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const brand = await getActiveBrand();
  const { data } = await supabase
    .from("snapshots")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  const updatedAt = data?.[0]
    ? new Date(data[0].created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <html lang="es">
      <body className="bg-background text-foreground">
        <div className="flex">
          <Sidebar updatedAt={updatedAt} brand={brand} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Rebrand de `login/page.tsx`**

Solo cambia el JSX del return (la lógica de auth queda igual):

```tsx
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={onSubmit}
        className="bg-surface border border-border rounded-2xl p-8 w-80 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-bright tracking-widest">VANTAGE STUDIO</h1>
          <p className="text-xs text-dim tracking-widest">COMMAND CENTER</p>
        </div>
        <input type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-dim" />
        <input type="password" required placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-dim" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading}
          className="w-full bg-accent/20 border border-accent/50 text-bright rounded-lg py-2 hover:bg-accent/30 disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
```

- [ ] **Step 4: Verificar build (el Sidebar aún no acepta `brand` — esperar a Task 6 si falla)**

Run: `npm run build`
Expected: error de tipos en `Sidebar` por la prop `brand` — es la señal para seguir a Task 6. Si se prefiere build verde por commit, hacer Tasks 5 y 6 en un solo commit al final de Task 6.

- [ ] **Step 5: Commit (junto con Task 6 si el build lo exige)**

```bash
git add web/src/app/globals.css web/src/app/layout.tsx web/src/app/login/page.tsx
git commit -m "feat: tema command-center + rebrand a Vantage Studio"
```

---

### Task 6: Sidebar nuevo + selector de marca

**Files:**
- Create: `web/src/components/BrandSwitcher.tsx`
- Modify: `web/src/components/Sidebar.tsx` (reemplazo completo)

- [ ] **Step 1: Crear `BrandSwitcher.tsx`**

```tsx
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
```

- [ ] **Step 2: Reemplazar `Sidebar.tsx` completo**

```tsx
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
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila sin errores (la prop `brand` de Task 5 ya existe). Nota: `app/page.tsx` y `[section]/page.tsx` aún tienen estilos viejos — funcional, se restylan en Tasks 7-8.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/Sidebar.tsx web/src/components/BrandSwitcher.tsx
git commit -m "feat: sidebar agrupado con selector de marca"
```

---

### Task 7: snapshots multi-marca

**Files:**
- Modify: `web/src/lib/snapshots.ts` (función `runSnapshot`)

- [ ] **Step 1: Actualizar el upsert de `runSnapshot`**

En `web/src/lib/snapshots.ts`, dentro del `for` de `runSnapshot`, el upsert pasa a incluir `brand_id` (el cron de YouTube alimenta la marca personal) y el nuevo onConflict:

```ts
      const { error } = await supabase.from("snapshots").upsert(
        {
          brand_id: "personal",
          platform: stats.platform,
          snapshot_date: today,
          followers: stats.followers,
          total_views: stats.totalViews,
          posts_count: stats.postsCount,
        },
        { onConflict: "brand_id,platform,snapshot_date" }
      );
```

`computeDeltas` y `SnapshotRow` no cambian.

- [ ] **Step 2: Correr tests**

Run: `npm test`
Expected: PASS (computeDeltas intacto; runSnapshot no tiene unit test).

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/snapshots.ts
git commit -m "feat: snapshots con brand_id (cron alimenta marca personal)"
```

---

### Task 8: Dashboard command-center + tarjetas

**Files:**
- Modify: `web/src/components/PlatformColumn.tsx` (reemplazo completo)
- Modify: `web/src/app/page.tsx` (reemplazo completo)

- [ ] **Step 1: Reemplazar `PlatformColumn.tsx`**

Mantiene `PlatformColumn` (datos reales) y reemplaza `PlaceholderColumn` por `DemoColumn` (módulos aún sin API, marcados DEMO):

```tsx
import Sparkline from "./Sparkline";
import type { Deltas } from "@/lib/snapshots";

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n >= 10_000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString("es-CO");
}

export function PlatformColumn({ name, icon, unit, deltas }:
  { name: string; icon: string; unit: string; deltas: Deltas }) {
  const d = deltas.vsYesterday;
  return (
    <div className="flex-1 bg-surface border border-border rounded-xl p-4">
      <div className="font-bold text-bright border-b border-border pb-2 mb-2">
        <span className="text-accent">{icon}</span> {name}
      </div>
      <div className="text-2xl font-extrabold text-bright">
        {fmt(deltas.current)}{" "}
        {d !== null && (
          <span className={`text-xs ${d >= 0 ? "text-ok" : "text-red-400"}`}>
            {d >= 0 ? "▲" : "▼"}{Math.abs(d)}
          </span>
        )}
      </div>
      <div className="text-xs text-dim mb-2">{unit} · vs ayer</div>
      <Sparkline values={deltas.spark} />
      {deltas.vsWeek !== null && (
        <div className="text-xs text-muted mt-1">
          7 días: {deltas.vsWeek >= 0 ? "+" : ""}{deltas.vsWeek}
        </div>
      )}
    </div>
  );
}

export function DemoColumn({ name, icon, note }:
  { name: string; icon: string; note: string }) {
  return (
    <div className="flex-1 bg-surface/50 border border-dashed border-border rounded-xl p-4">
      <div className="font-bold text-muted border-b border-border pb-2 mb-2 flex items-center gap-2">
        <span>{icon} {name}</span>
        <span className="ml-auto text-[9px] border border-warn/50 text-warn rounded px-1.5 py-0.5">DEMO</span>
      </div>
      <div className="text-2xl font-extrabold text-dim">—</div>
      <div className="text-xs text-dim mb-2">{note}</div>
    </div>
  );
}
```

- [ ] **Step 2: Reemplazar `app/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import { PlatformColumn, DemoColumn } from "@/components/PlatformColumn";
import RefreshButton from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const brand = await getActiveBrand();
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const [{ data: snaps }, { count: autoAgents }, { data: runs }] = await Promise.all([
    supabase.from("snapshots")
      .select("platform,snapshot_date,followers,total_views,posts_count")
      .eq("brand_id", brand.id).gte("snapshot_date", since),
    supabase.from("agent_settings")
      .select("agent_id", { count: "exact", head: true })
      .eq("brand_id", brand.id).neq("autonomy", "manual"),
    supabase.from("agent_runs").select("id,agent_id,action,status,created_at")
      .eq("brand_id", brand.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const rows = (snaps ?? []) as SnapshotRow[];
  const youtube = computeDeltas(rows.filter((r) => r.platform === "youtube"));

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-accent">
            ✦ COMMAND CENTER · {brand.name.toUpperCase()}
          </p>
          <h1 className="text-3xl font-extrabold text-bright tracking-wider">VANTAGE STUDIO</h1>
        </div>
        <RefreshButton />
      </div>
      <p className="text-xs text-dim tracking-widest mb-4">CMO AGENT + ANALYTICS</p>

      <Link href="/jarvis"
        className="block bg-gradient-to-r from-surface-2 to-surface border border-accent/40 rounded-xl p-4 mb-6 hover:border-accent">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-accent">◉</span>
          <div>
            <div className="font-bold text-bright tracking-widest">J.A.R.V.I.S. — Launch Fullscreen</div>
            <div className="text-[10px] text-dim tracking-widest">ORBE 3D AUDIO-REACTIVO · LLEGA EN FASE 3</div>
          </div>
        </div>
      </Link>

      <p className="text-[10px] tracking-widest text-dim mb-2">✦ CANALES</p>
      <div className="flex gap-3 mb-6">
        <PlatformColumn name="YouTube" icon="▶" unit="suscriptores" deltas={youtube} />
        <DemoColumn name="Instagram" icon="◎" note="se conecta en Fase 7 (trámites Meta)" />
        <DemoColumn name="Meta Ads" icon="▣" note="se conecta en Fase 7 (trámites Meta)" />
        <DemoColumn name="WhatsApp" icon="✆" note="llega en Fase 5 (runner)" />
      </div>

      <p className="text-[10px] tracking-widest text-dim mb-2">✦ AGENTES</p>
      <div className="flex gap-3">
        <Link href="/agentes"
          className="flex-1 bg-surface border border-border rounded-xl p-4 hover:border-accent/50">
          <div className="text-2xl font-extrabold text-bright">{autoAgents ?? 0}</div>
          <div className="text-xs text-dim">agentes en copiloto/auto · configurar →</div>
        </Link>
        <div className="flex-[2] bg-surface border border-border rounded-xl p-4">
          <div className="text-[10px] tracking-widest text-dim mb-1">ÚLTIMA ACTIVIDAD</div>
          {(runs ?? []).length === 0 ? (
            <p className="text-xs text-dim">Sin actividad aún — los agentes despiertan en la Fase 2.</p>
          ) : (
            (runs ?? []).map((r) => (
              <div key={r.id} className="text-xs text-muted">
                <span className={r.status === "ok" ? "text-ok" : "text-warn"}>●</span>{" "}
                {r.agent_id} · {r.action}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila. (`[section]/page.tsx` sigue usando `item.emoji` — si el type-check falla por eso, es la señal para Task 9; en ese caso terminar Task 9 antes de commitear.)

- [ ] **Step 4: Commit**

```bash
git add web/src/components/PlatformColumn.tsx web/src/app/page.tsx
git commit -m "feat: dashboard command-center por marca con KPIs y agentes"
```

---

### Task 9: Placeholders de secciones nuevos

**Files:**
- Modify: `web/src/app/[section]/page.tsx` (reemplazo completo)

- [ ] **Step 1: Reemplazar `[section]/page.tsx`**

Usa `item.icon` y `item.phase` del nav nuevo (ya no existe `PHASE_BY_SLUG` ni `emoji`):

```tsx
import { notFound } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

export default async function SectionPage({ params }:
  { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = NAV_ITEMS.find((i) => i.slug === section);
  if (!item) notFound();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-3 text-accent">{item.icon}</div>
      <h1 className="text-2xl font-bold text-bright tracking-wider">{item.label}</h1>
      <p className="text-muted mt-1">
        {item.phase ? `Próximamente — llega en la Fase ${item.phase}.` : "Próximamente."}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build y tests**

Run: `npm run build && npm test`
Expected: build verde, tests PASS.

- [ ] **Step 3: Commit**

```bash
git add "web/src/app/[section]/page.tsx"
git commit -m "feat: placeholders de módulos con fase del roadmap"
```

---

### Task 10: Panel de Agentes (página + API de autonomía)

**Files:**
- Create: `web/src/app/agentes/page.tsx` (ruta estática — gana sobre `[section]`)
- Create: `web/src/app/api/agents/autonomy/route.ts`
- Create: `web/src/components/AutonomyPicker.tsx`

- [ ] **Step 1: Crear la API `app/api/agents/autonomy/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AGENTS, AUTONOMY_LEVELS, type Autonomy } from "@/lib/agents";
import { BRANDS } from "@/lib/brands";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  const body = (await req.json()) as
    { agentId?: string; brandId?: string; autonomy?: Autonomy };
  const valid =
    AGENTS.some((a) => a.id === body.agentId) &&
    BRANDS.some((b) => b.id === body.brandId) &&
    AUTONOMY_LEVELS.includes(body.autonomy as Autonomy);
  if (!valid) return NextResponse.json({ error: "payload inválido" }, { status: 400 });

  const { error } = await supabase.from("agent_settings").upsert(
    {
      agent_id: body.agentId,
      brand_id: body.brandId,
      autonomy: body.autonomy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agent_id,brand_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Crear `components/AutonomyPicker.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUTONOMY_LEVELS, type Autonomy } from "@/lib/agents";

const LABELS: Record<Autonomy, string> = {
  manual: "Manual", copiloto: "Copiloto", auto: "Auto",
};

export default function AutonomyPicker({ agentId, brandId, value }:
  { agentId: string; brandId: string; value: Autonomy }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function set(autonomy: Autonomy) {
    if (autonomy === value || saving) return;
    setSaving(true);
    const res = await fetch("/api/agents/autonomy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, brandId, autonomy }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className={`inline-flex border border-border rounded-lg overflow-hidden text-xs ${saving ? "opacity-50" : ""}`}>
      {AUTONOMY_LEVELS.map((level) => (
        <button key={level} onClick={() => set(level)} disabled={saving}
          className={`px-2.5 py-1 ${
            level === value
              ? level === "auto" ? "bg-warn/20 text-warn"
                : level === "copiloto" ? "bg-accent/20 text-accent"
                : "bg-surface-2 text-bright"
              : "text-dim hover:text-muted"}`}>
          {LABELS[level]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Crear `app/agentes/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import { mergeAgentSettings, type AgentSettingRow } from "@/lib/agents";
import AutonomyPicker from "@/components/AutonomyPicker";

export const dynamic = "force-dynamic";

export default async function AgentesPage() {
  const supabase = await createClient();
  const brand = await getActiveBrand();

  const [{ data: settings }, { data: runs }] = await Promise.all([
    supabase.from("agent_settings")
      .select("agent_id,brand_id,autonomy").eq("brand_id", brand.id),
    supabase.from("agent_runs")
      .select("id,agent_id,action,status,cost_usd,created_at")
      .eq("brand_id", brand.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const agents = mergeAgentSettings((settings ?? []) as AgentSettingRow[]);

  return (
    <div className="max-w-4xl">
      <p className="text-[10px] tracking-[0.25em] text-accent">✦ INTELIGENCIA · {brand.name.toUpperCase()}</p>
      <h1 className="text-2xl font-extrabold text-bright tracking-wider mb-1">AGENTES</h1>
      <p className="text-xs text-dim mb-6">
        Autonomía por agente para esta marca: Manual (no hace nada solo) ·
        Copiloto (deja borradores para tu aprobación) · Auto (ejecuta con reglas).
        Los agentes cobran vida desde la Fase 2.
      </p>

      <div className="space-y-2 mb-8">
        {agents.map((a) => (
          <div key={a.id}
            className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4">
            <div className="flex-1">
              <div className="font-bold text-bright">{a.name}
                <span className="ml-2 text-[9px] text-dim tracking-widest uppercase">{a.module}</span>
              </div>
              <div className="text-xs text-muted">{a.desc}</div>
            </div>
            <AutonomyPicker agentId={a.id} brandId={brand.id} value={a.autonomy} />
          </div>
        ))}
      </div>

      <p className="text-[10px] tracking-widest text-dim mb-2">✦ BITÁCORA</p>
      <div className="bg-surface border border-border rounded-xl p-4">
        {(runs ?? []).length === 0 ? (
          <p className="text-xs text-dim">
            Sin actividad aún. Todo lo que un agente haga quedará registrado aquí
            (acción, estado y costo de API).
          </p>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {(runs ?? []).map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5">
                    <span className={r.status === "ok" ? "text-ok" : r.status === "error" ? "text-red-400" : "text-warn"}>●</span>
                  </td>
                  <td className="text-bright">{r.agent_id}</td>
                  <td className="text-muted">{r.action}</td>
                  <td className="text-dim text-right">
                    {r.cost_usd != null ? `$${Number(r.cost_usd).toFixed(3)}` : ""}
                  </td>
                  <td className="text-dim text-right">
                    {new Date(r.created_at).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar build y tests**

Run: `npm run build && npm test`
Expected: build verde, tests PASS.

- [ ] **Step 5: Probar a mano en dev**

Run: `npm run dev` y abrir `http://localhost:3000`
Esperado: login estilo Vantage → dashboard command-center → cambiar marca en el selector refresca KPIs → `/agentes` permite cambiar autonomía y persiste tras recargar.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/agentes web/src/app/api/agents web/src/components/AutonomyPicker.tsx
git commit -m "feat: panel de agentes con autonomía graduable y bitácora"
```

---

### Task 11: Verificación final y deploy

**Files:** ninguno nuevo.

- [ ] **Step 1: Suite completa**

Run: `npm test && npm run lint && npm run build`
Expected: todo verde, cero warnings nuevos.

- [ ] **Step 2: Push y deploy**

```bash
git push origin main
```

Vercel despliega automático (proyecto `prj_PUmJdFnOaoqBfwvPvy2kuoWYESeX`).

- [ ] **Step 3: Verificar producción**

Run: `curl -s -o /dev/null -w "%{http_code}" https://dashboard-social-eight.vercel.app/login`
Expected: `200`. Verificar a ojo: login Vantage, dashboard oscuro, selector de marca, `/agentes` funcional.

- [ ] **Step 4: Actualizar memoria del proyecto** (nota para el ejecutor con acceso a memoria)

Actualizar `project_dashboard_social.md` → el proyecto ahora es Vantage Studio, Fase 1 Metamorfosis desplegada.
