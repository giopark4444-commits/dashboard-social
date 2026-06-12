# Fase Diseño 4 — Modo Demo Local + Móvil + PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Modo demo SOLO de desarrollo local para navegar la app sin login (Gio aún no tiene usuario auth), (2) experiencia móvil completa (topbar + drawer en pantallas chicas), (3) PWA instalable en iPhone/Android con icono Vantage.

**Architecture:** El modo demo es un bypass en `proxy.ts` doblemente blindado (`DEMO_MODE=1` **y** `NODE_ENV === "development"` — imposible en Vercel) con banner visible. El móvil agrega un `MobileTopbar` (client, drawer fullscreen) y oculta el Sidebar bajo `md`; el dashboard pasa a grids responsive. La PWA usa `app/manifest.ts` de Next + iconos ya commiteados en `web/public/` por el controlador (icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png) — NO hay service worker (YAGNI; instalable basta).

**Tech Stack:** Next.js 16.2.7. SIN dependencias nuevas.

**Reglas del repo:** `web/AGENTS.md`; npm desde `web/`; git desde la raíz. Rama: `vantage-diseno-4`. Lint: sin comillas dobles literales en JSX.

---

### Task 1: Modo demo local

**Files:**
- Modify: `web/src/proxy.ts`
- Modify: `web/src/app/layout.tsx`
- Modify: `web/.env.example` y `web/.env.local`

- [ ] **Step 1: En `proxy.ts`**, agregar el bypass como PRIMERAS líneas del cuerpo de `proxy()` (antes de crear el cliente de Supabase):

```ts
export async function proxy(request: NextRequest) {
  // Modo demo SOLO en desarrollo local (npm run dev). Nunca activo en builds de producción.
  if (process.env.DEMO_MODE === "1" && process.env.NODE_ENV === "development")
    return NextResponse.next({ request });

  let response = NextResponse.next({ request });
```

Y en el `config.matcher`, excluir también el manifest (lo usa la Task 3):

```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|ico)).*)"],
};
```

- [ ] **Step 2: Banner de demo en `layout.tsx`.** Dentro del `<body>`, justo antes de cerrar (después del div flex), agregar:

```tsx
        {process.env.DEMO_MODE === "1" && process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 text-[10px] tracking-widest bg-warn/15 border border-warn/50 text-warn rounded-full px-3 py-1 backdrop-blur">
            ◉ MODO DEMO LOCAL — SIN SESIÓN
          </div>
        )}
```

- [ ] **Step 3: Env.** Agregar al final de `web/.env.example`:

```
# Solo desarrollo local: navegar sin login (NUNCA poner en Vercel)
# DEMO_MODE=1
```

Y agregar al final de `web/.env.local` (existe; NO tocar las demás líneas): `DEMO_MODE=1`

- [ ] **Step 4: Verificar a mano** → `npm run dev`, abrir `http://localhost:3000`: debe entrar al Dashboard SIN login y verse el banner ámbar abajo. Las métricas salen vacías ("—") porque no hay sesión — correcto.

- [ ] **Step 5: Build** → `npm run build` verde. **Step 6: Commit**

```bash
git add web/src/proxy.ts web/src/app/layout.tsx web/.env.example
git commit -m "feat: modo demo local sin login (solo desarrollo)"
```

(`.env.local` está gitignored — el cambio queda solo en la máquina.)

---

### Task 2: Experiencia móvil

**Files:**
- Create: `web/src/components/MobileTopbar.tsx`
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/page.tsx` (grids responsive)

- [ ] **Step 1: Crear `web/src/components/MobileTopbar.tsx`:**

```tsx
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
```

- [ ] **Step 2: En `layout.tsx`:** importar `MobileTopbar`, ocultar el Sidebar en móvil y dar aire al main. El bloque del body queda:

```tsx
      <body className="bg-background text-foreground">
        <MobileTopbar brand={brand} />
        <div className="flex">
          <div className="hidden md:block">
            <Sidebar updatedAt={updatedAt} brand={brand} />
          </div>
          <main className="flex-1 p-4 pt-16 md:p-6">{children}</main>
        </div>
```

(el banner de demo de la Task 1 sigue después, intacto.)

- [ ] **Step 3: Dashboard responsive en `page.tsx`:**
  - La fila de canales pasa de `"flex gap-3 mb-6"` a `"grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"`.
  - La fila de agentes pasa de `"flex gap-3"` a `"flex flex-col md:flex-row gap-3"`.

- [ ] **Step 4: Verificar** → `npm test && npm run lint && npm run build` verdes; en dev con el viewport angosto (DevTools) se ve topbar + drawer y el dashboard en 2 columnas.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/MobileTopbar.tsx web/src/app/layout.tsx web/src/app/page.tsx
git commit -m "feat: experiencia móvil — topbar con drawer y dashboard responsive"
```

---

### Task 3: PWA instalable

**Files:**
- Create: `web/src/app/manifest.ts`
- Modify: `web/src/app/layout.tsx` (metadata + viewport)
- (Los iconos `web/public/icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` YA están commiteados por el controlador — no crearlos.)

- [ ] **Step 1: Crear `web/src/app/manifest.ts`:**

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vantage Studio",
    short_name: "Vantage",
    description: "Command center de marketing con agentes IA",
    start_url: "/",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#070b14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
```

- [ ] **Step 2: En `layout.tsx`,** reemplazar la línea de metadata y agregar viewport (el import de `Metadata` se amplía con `Viewport`):

```tsx
import type { Metadata, Viewport } from "next";
// ...
export const metadata: Metadata = {
  title: "Vantage Studio",
  appleWebApp: { capable: true, title: "Vantage", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#070b14" };
```

- [ ] **Step 3: Verificar** → `npm test && npm run lint && npm run build` verdes; `curl -s localhost:3000/manifest.webmanifest` en dev devuelve el JSON.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/manifest.ts web/src/app/layout.tsx
git commit -m "feat: PWA instalable — manifest, iconos y meta de Apple"
```

---

### Task 4: Cierre

- [ ] Suite completa verde. El merge, push y verificación de deploy los hace el controlador.

**Prueba manual para Gio:** en el iPhone, abrir la URL en Safari → Compartir → "Agregar a pantalla de inicio" → icono Vantage, abre fullscreen sin barra de navegador. En el Mac: `cd web && npm run dev` → navegar TODO sin login con el banner ámbar visible.
