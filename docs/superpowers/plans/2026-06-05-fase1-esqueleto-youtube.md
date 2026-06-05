# Fase 1: Esqueleto + YouTube — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Next.js desplegable con login de un solo usuario, sidebar completo (14 rubros, los no implementados muestran "próximamente"), snapshot diario de YouTube en Supabase, e Inicio con vista panorámica básica.

**Architecture:** Next.js App Router (en `web/`) + Supabase (Postgres/Auth/RLS) + Vercel (hosting + cron diario). El cron consulta la YouTube Data API v3 con API key (stats públicas del canal, sin OAuth en esta fase) y guarda una fila por día en `snapshots`. El Inicio lee de Supabase y calcula deltas/sparkline en código puro (testeado).

**Tech Stack:** Next.js 15 (TypeScript, Tailwind), @supabase/ssr + @supabase/supabase-js, Vitest, YouTube Data API v3, Vercel Crons.

**Spec:** `docs/superpowers/specs/2026-06-05-dashboard-social-design.md`

---

## Estructura de archivos (resultado final de la fase)

```
web/
  vercel.json                      ← cron diario
  .env.example                     ← variables documentadas
  vitest.config.ts
  supabase/migrations/0001_snapshots.sql
  src/
    middleware.ts                  ← protege todo salvo /login
    lib/
      nav.ts                       ← definición de los 14 rubros del menú
      supabase/server.ts           ← cliente Supabase server-side (cookies)
      supabase/admin.ts            ← cliente service-role (solo crons)
      platforms/youtube.ts         ← fetch + parser de stats del canal
      snapshots.ts                 ← guardar snapshot, deltas, sparkline
      __tests__/youtube.test.ts
      __tests__/snapshots.test.ts
    app/
      layout.tsx                   ← shell: sidebar + contenido
      page.tsx                     ← 🏠 Inicio (panorámico)
      login/page.tsx
      [section]/page.tsx           ← "próximamente" genérico para los demás rubros
      api/cron/snapshot/route.ts
      api/refresh/route.ts
    components/
      Sidebar.tsx
      PlatformColumn.tsx
      Sparkline.tsx
      RefreshButton.tsx
```

Responsabilidades: `youtube.ts` solo habla con la API y devuelve un tipo normalizado; `snapshots.ts` solo persiste/calcula; las rutas API solo orquestan; los componentes solo pintan.

---

### Task 0: Prerequisitos manuales (los hace Gio, ~15 min)

**Files:** ninguno (trámites externos)

- [ ] **Step 1: Proyecto Supabase** — En supabase.com crear proyecto `dashboard-social` (región us-east-1). Guardar: `Project URL`, `anon key`, `service_role key`. En Authentication → Providers dejar solo Email; en Authentication → Settings **desactivar "Allow new users to sign up"**. Crear el usuario manualmente: Authentication → Users → Add user → email `gio.park.4444@gmail.com` + contraseña.
- [ ] **Step 2: API key de YouTube** — En console.cloud.google.com: crear proyecto → "APIs & Services" → habilitar **YouTube Data API v3** → Credentials → Create API key. Guardarla.
- [ ] **Step 3: Channel ID** — En YouTube Studio → Settings → Channel → Advanced settings → copiar "Channel ID" (empieza con `UC…`).
- [ ] **Step 4: Generar CRON_SECRET** — `openssl rand -hex 16` y guardar el valor.

---

### Task 1: Scaffold del proyecto Next.js

**Files:**
- Create: `web/` (create-next-app) · `web/.env.local` · `web/.env.example`

- [ ] **Step 1: Crear la app**

```bash
cd "/Users/usuario/Desktop/social dashboard"
npx create-next-app@latest web --ts --tailwind --eslint --app --src-dir --use-npm --no-import-alias
```

Expected: carpeta `web/` con `src/app/`.

- [ ] **Step 2: Instalar dependencias**

```bash
cd web && npm i @supabase/supabase-js @supabase/ssr && npm i -D vitest
```

- [ ] **Step 3: Crear `web/.env.example`** (y copiar a `.env.local` con valores reales del Task 0)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_EMAIL=gio.park.4444@gmail.com
YOUTUBE_API_KEY=AIza...
YOUTUBE_CHANNEL_ID=UC...
CRON_SECRET=hex32
```

- [ ] **Step 4: Verificar que arranca**

Run: `npm run dev` → abrir http://localhost:3000
Expected: página default de Next.js sin errores.

- [ ] **Step 5: Commit**

```bash
cd "/Users/usuario/Desktop/social dashboard"
git add web && git commit -m "feat: scaffold Next.js (Fase 1)"
```

---

### Task 2: Migración de base de datos `snapshots`

**Files:**
- Create: `web/supabase/migrations/0001_snapshots.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- snapshots: 1 fila por plataforma por día
create table public.snapshots (
  id bigint generated always as identity primary key,
  platform text not null,
  snapshot_date date not null,
  followers integer,
  total_views bigint,
  posts_count integer,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (platform, snapshot_date)
);

alter table public.snapshots enable row level security;

-- lectura para usuarios logueados; escritura SOLO via service role (bypassa RLS)
create policy "authenticated_read_snapshots"
  on public.snapshots for select to authenticated using (true);
```

- [ ] **Step 2: Aplicarla** — pegar el SQL en Supabase Dashboard → SQL Editor → Run (o vía MCP `apply_migration`).

Expected: `Success. No rows returned`.

- [ ] **Step 3: Verificar** — en SQL Editor: `select * from public.snapshots;` → 0 filas, sin error.

- [ ] **Step 4: Commit**

```bash
git add web/supabase && git commit -m "feat: tabla snapshots con RLS"
```

---

### Task 3: Clientes Supabase y middleware de auth

**Files:**
- Create: `web/src/lib/supabase/server.ts` · `web/src/lib/supabase/admin.ts` · `web/src/middleware.ts`

- [ ] **Step 1: Cliente server-side** — `web/src/lib/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {} // Server Component: el middleware refresca la sesión
        },
      },
    }
  );
}
```

- [ ] **Step 2: Cliente admin (solo rutas server)** — `web/src/lib/supabase/admin.ts`

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
```

- [ ] **Step 3: Middleware** — `web/src/middleware.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isCron = request.nextUrl.pathname.startsWith("/api/cron");
  const allowed = user?.email === process.env.ALLOWED_EMAIL;

  if (isCron) return response; // el cron valida CRON_SECRET por su cuenta
  if (!allowed && !isLogin)
    return NextResponse.redirect(new URL("/login", request.url));
  if (allowed && isLogin)
    return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico)).*)"],
};
```

- [ ] **Step 4: Verificar** — `npm run dev`, abrir http://localhost:3000 → debe redirigir a `/login` (404 por ahora: la página llega en Task 4).

- [ ] **Step 5: Commit**

```bash
git add web/src && git commit -m "feat: clientes supabase + middleware de auth"
```

---

### Task 4: Página de login

**Files:**
- Create: `web/src/app/login/page.tsx`

- [ ] **Step 1: Login con email/contraseña (client component)**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Credenciales incorrectas");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-100">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow p-8 w-80 space-y-4">
        <h1 className="text-xl font-bold text-stone-800">Dashboard Social</h1>
        <input type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2" />
        <input type="password" required placeholder="Contraseña" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading}
          className="w-full bg-stone-800 text-white rounded-lg py-2 disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verificar manualmente** — `npm run dev` → `/login` → entrar con el usuario del Task 0 → debe redirigir a `/` (página default por ahora). Probar también un password malo → "Credenciales incorrectas".

- [ ] **Step 3: Commit**

```bash
git add web/src/app/login && git commit -m "feat: login de usuario único"
```

---

### Task 5: Shell de la app — sidebar de 14 rubros + "próximamente"

**Files:**
- Create: `web/src/lib/nav.ts` · `web/src/components/Sidebar.tsx` · `web/src/app/[section]/page.tsx`
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Definición del menú** — `web/src/lib/nav.ts`

```ts
export type NavItem = { slug: string; label: string; emoji: string; group: 1 | 2 | 3 };

// group 1 = analítica/contenido · 2 = mensajería · 3 = inferior
export const NAV_ITEMS: NavItem[] = [
  { slug: "", label: "Inicio", emoji: "🏠", group: 1 },
  { slug: "posts", label: "Posts", emoji: "🗂", group: 1 },
  { slug: "constancia", label: "Constancia", emoji: "📈", group: 1 },
  { slug: "ideas", label: "Ideas IA", emoji: "💡", group: 1 },
  { slug: "asistente", label: "Asistente", emoji: "💬", group: 1 },
  { slug: "audiencia", label: "Mi audiencia", emoji: "🧠", group: 1 },
  { slug: "voz", label: "Mi voz", emoji: "🎙", group: 1 },
  { slug: "proximos", label: "Próximos", emoji: "🎬", group: 1 },
  { slug: "calendario", label: "Calendario", emoji: "📅", group: 1 },
  { slug: "tendencias", label: "Tendencias", emoji: "📊", group: 1 },
  { slug: "referentes", label: "Referentes", emoji: "👥", group: 1 },
  { slug: "campanas", label: "Campañas", emoji: "🤝", group: 1 },
  { slug: "telegram", label: "Telegram", emoji: "✈️", group: 2 },
  { slug: "discord", label: "Discord", emoji: "🎮", group: 2 },
  { slug: "ajustes", label: "Ajustes", emoji: "⚙️", group: 3 },
];

export const SECTION_SLUGS = NAV_ITEMS.map((i) => i.slug).filter(Boolean);
```

- [ ] **Step 2: Sidebar** — `web/src/components/Sidebar.tsx`

```tsx
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
```

- [ ] **Step 3: Layout con shell** — reemplazar `web/src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard Social" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
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
      <body className="bg-stone-50 text-stone-900">
        <div className="flex">
          <Sidebar updatedAt={updatedAt} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

Nota: en `/login` el layout también pinta el sidebar; aceptable en Fase 1 porque el middleware saca de `/login` al usuario logueado y al no logueado solo le permite `/login` (el sidebar sin datos no filtra nada).

- [ ] **Step 4: Página genérica "próximamente"** — `web/src/app/[section]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

const PHASE_BY_SLUG: Record<string, string> = {
  posts: "Fase 6", constancia: "Fase 6", ideas: "Fase 7", asistente: "Fase 7",
  audiencia: "Fase 7", voz: "Fase 7", proximos: "Fase 8", calendario: "Fase 8",
  tendencias: "Fase 8", referentes: "Fase 8", campanas: "Fase 8",
  telegram: "Fase 2", discord: "Fase 3", ajustes: "Fase 4",
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = NAV_ITEMS.find((i) => i.slug === section);
  if (!item) notFound();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-3">{item.emoji}</div>
      <h1 className="text-2xl font-bold mb-1">{item.label}</h1>
      <p className="text-stone-500">Próximamente — llega en la {PHASE_BY_SLUG[section]}.</p>
    </div>
  );
}
```

- [ ] **Step 5: Verificar** — `npm run dev`, loguearse, navegar a `/posts`, `/telegram`, `/ajustes` → cada una muestra su "próximamente"; `/loquesea` → 404.

- [ ] **Step 6: Commit**

```bash
git add web/src && git commit -m "feat: shell con sidebar de 14 rubros y placeholders"
```

---

### Task 6: Adaptador de YouTube (TDD)

**Files:**
- Create: `web/src/lib/platforms/youtube.ts` · `web/src/lib/__tests__/youtube.test.ts` · `web/vitest.config.ts`
- Modify: `web/package.json` (script test)

- [ ] **Step 1: Config de Vitest** — `web/vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

En `web/package.json`, dentro de `"scripts"`, agregar: `"test": "vitest run"`.

- [ ] **Step 2: Test que falla** — `web/src/lib/__tests__/youtube.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { parseYouTubeChannel } from "@/lib/platforms/youtube";

const apiResponse = {
  kind: "youtube#channelListResponse",
  items: [
    {
      id: "UC123",
      statistics: {
        viewCount: "8900",
        subscriberCount: "3205",
        hiddenSubscriberCount: false,
        videoCount: "42",
      },
    },
  ],
};

describe("parseYouTubeChannel", () => {
  it("normaliza la respuesta de channels.list", () => {
    expect(parseYouTubeChannel(apiResponse)).toEqual({
      platform: "youtube",
      followers: 3205,
      totalViews: 8900,
      postsCount: 42,
    });
  });

  it("lanza error si no hay items (channel id malo)", () => {
    expect(() => parseYouTubeChannel({ items: [] })).toThrow(/sin statistics/);
  });
});
```

- [ ] **Step 3: Correr y ver que falla**

Run: `cd web && npm test`
Expected: FAIL — `Cannot find module '@/lib/platforms/youtube'`.

- [ ] **Step 4: Implementación mínima** — `web/src/lib/platforms/youtube.ts`

```ts
export type PlatformStats = {
  platform: "youtube";
  followers: number;
  totalViews: number;
  postsCount: number;
};

type YouTubeChannelsResponse = {
  items?: { statistics?: Record<string, string | boolean> }[];
};

export function parseYouTubeChannel(json: unknown): PlatformStats {
  const item = (json as YouTubeChannelsResponse)?.items?.[0];
  const s = item?.statistics;
  if (!s) throw new Error("YouTube: respuesta sin statistics (¿channel id correcto?)");
  return {
    platform: "youtube",
    followers: Number(s.subscriberCount),
    totalViews: Number(s.viewCount),
    postsCount: Number(s.videoCount),
  };
}

export async function fetchYouTubeStats(): Promise<PlatformStats> {
  const key = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channelId) throw new Error("Faltan YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID");
  const url =
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API respondió ${res.status}`);
  return parseYouTubeChannel(await res.json());
}
```

- [ ] **Step 5: Correr y ver que pasa**

Run: `npm test`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add web/src/lib web/vitest.config.ts web/package.json package-lock.json 2>/dev/null; cd "/Users/usuario/Desktop/social dashboard" && git add web && git commit -m "feat: adaptador YouTube con tests"
```

---

### Task 7: Lógica de snapshots y deltas (TDD)

**Files:**
- Create: `web/src/lib/snapshots.ts` · `web/src/lib/__tests__/snapshots.test.ts`

- [ ] **Step 1: Test que falla** — `web/src/lib/__tests__/snapshots.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";

function row(date: string, followers: number): SnapshotRow {
  return { platform: "youtube", snapshot_date: date, followers,
           total_views: 1000, posts_count: 10 };
}

describe("computeDeltas", () => {
  it("calcula delta vs ayer y vs hace 7 días", () => {
    const rows = [
      row("2026-06-05", 3205), row("2026-06-04", 3200),
      row("2026-06-03", 3190), row("2026-05-29", 3100),
    ];
    const d = computeDeltas(rows);
    expect(d.current).toBe(3205);
    expect(d.vsYesterday).toBe(5);      // 3205 - 3200
    expect(d.vsWeek).toBe(105);         // 3205 - 3100 (fila más cercana ≥7 días atrás)
    expect(d.spark).toEqual([3100, 3190, 3200, 3205]); // cronológico
  });

  it("devuelve nulls sin datos suficientes", () => {
    const d = computeDeltas([row("2026-06-05", 3205)]);
    expect(d.current).toBe(3205);
    expect(d.vsYesterday).toBeNull();
    expect(d.vsWeek).toBeNull();
  });

  it("devuelve todo null sin filas", () => {
    const d = computeDeltas([]);
    expect(d.current).toBeNull();
    expect(d.spark).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/snapshots'`.

- [ ] **Step 3: Implementación** — `web/src/lib/snapshots.ts`

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchYouTubeStats } from "@/lib/platforms/youtube";

export type SnapshotRow = {
  platform: string;
  snapshot_date: string; // YYYY-MM-DD
  followers: number | null;
  total_views: number | null;
  posts_count: number | null;
};

export type Deltas = {
  current: number | null;
  vsYesterday: number | null;
  vsWeek: number | null;
  spark: number[]; // followers en orden cronológico
};

const DAY_MS = 86_400_000;

/** rows: cualquier orden; usa followers como métrica principal */
export function computeDeltas(rows: SnapshotRow[]): Deltas {
  const sorted = [...rows]
    .filter((r) => r.followers !== null)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)); // asc
  if (sorted.length === 0)
    return { current: null, vsYesterday: null, vsWeek: null, spark: [] };

  const latest = sorted[sorted.length - 1];
  const latestT = Date.parse(latest.snapshot_date);
  const prev = sorted[sorted.length - 2] ?? null;
  const weekAgo = [...sorted].reverse()
    .find((r) => latestT - Date.parse(r.snapshot_date) >= 7 * DAY_MS) ?? null;

  return {
    current: latest.followers,
    vsYesterday: prev ? latest.followers! - prev.followers! : null,
    vsWeek: weekAgo ? latest.followers! - weekAgo.followers! : null,
    spark: sorted.map((r) => r.followers!),
  };
}

/** Consulta las APIs y hace upsert del snapshot de hoy. Una plataforma caída no tumba a las demás. */
export async function runSnapshot(): Promise<{ ok: string[]; failed: string[] }> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const ok: string[] = [];
  const failed: string[] = [];

  // Fase 1: solo YouTube. Fases 4-5 agregan meta/tiktok a esta lista.
  const jobs = [{ platform: "youtube", fetch: fetchYouTubeStats }];

  for (const job of jobs) {
    try {
      const stats = await job.fetch();
      const { error } = await supabase.from("snapshots").upsert(
        {
          platform: stats.platform,
          snapshot_date: today,
          followers: stats.followers,
          total_views: stats.totalViews,
          posts_count: stats.postsCount,
        },
        { onConflict: "platform,snapshot_date" }
      );
      if (error) throw new Error(error.message);
      ok.push(job.platform);
    } catch {
      failed.push(job.platform);
    }
  }
  return { ok, failed };
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `npm test`
Expected: PASS (5 tests en 2 archivos).

- [ ] **Step 5: Commit**

```bash
cd "/Users/usuario/Desktop/social dashboard" && git add web && git commit -m "feat: lógica de snapshots y deltas con tests"
```

---

### Task 8: Rutas API — cron diario y refresh manual

**Files:**
- Create: `web/src/app/api/cron/snapshot/route.ts` · `web/src/app/api/refresh/route.ts` · `web/vercel.json`

- [ ] **Step 1: Ruta del cron** — `web/src/app/api/cron/snapshot/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { runSnapshot } from "@/lib/snapshots";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await runSnapshot();
  return NextResponse.json(result, { status: result.failed.length ? 207 : 200 });
}
```

- [ ] **Step 2: Ruta de refresh (botón "Actualizar datos")** — `web/src/app/api/refresh/route.ts`

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runSnapshot } from "@/lib/snapshots";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== process.env.ALLOWED_EMAIL)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await runSnapshot();
  return NextResponse.json(result);
}
```

- [ ] **Step 3: Cron de Vercel** — `web/vercel.json` (11:00 UTC = 6:00 a.m. Colombia)

```json
{
  "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 11 * * *" }]
}
```

- [ ] **Step 4: Probar en local**

```bash
curl -s -X GET http://localhost:3000/api/cron/snapshot -H "Authorization: Bearer $(grep CRON_SECRET web/.env.local | cut -d= -f2)"
```

Expected: `{"ok":["youtube"],"failed":[]}` y en Supabase: `select * from snapshots;` → 1 fila de hoy. Sin header → `{"error":"unauthorized"}`.

- [ ] **Step 5: Commit**

```bash
git add web && git commit -m "feat: cron de snapshot diario + refresh manual"
```

---

### Task 9: Inicio panorámico

**Files:**
- Create: `web/src/components/Sparkline.tsx` · `web/src/components/PlatformColumn.tsx` · `web/src/components/RefreshButton.tsx`
- Modify: `web/src/app/page.tsx` (reemplazar el default)

- [ ] **Step 1: Sparkline SVG** — `web/src/components/Sparkline.tsx`

```tsx
export default function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2)
    return <div className="h-8 flex items-center text-xs text-stone-400">acumulando datos…</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - min) / range) * 28}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2"
        className="text-emerald-600" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
```

- [ ] **Step 2: Columna de plataforma** — `web/src/components/PlatformColumn.tsx`

```tsx
import Sparkline from "./Sparkline";
import type { Deltas } from "@/lib/snapshots";

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n >= 10_000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString("es-CO");
}

export function PlatformColumn({ name, emoji, unit, deltas }:
  { name: string; emoji: string; unit: string; deltas: Deltas }) {
  const d = deltas.vsYesterday;
  return (
    <div className="flex-1 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
      <div className="font-bold border-b border-stone-100 pb-2 mb-2">{emoji} {name}</div>
      <div className="text-2xl font-extrabold">
        {fmt(deltas.current)}{" "}
        {d !== null && (
          <span className={`text-xs ${d >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {d >= 0 ? "▲" : "▼"}{Math.abs(d)}
          </span>
        )}
      </div>
      <div className="text-xs text-stone-400 mb-2">{unit} · vs ayer</div>
      <Sparkline values={deltas.spark} />
      {deltas.vsWeek !== null && (
        <div className="text-xs text-stone-500 mt-1">7 días: {deltas.vsWeek >= 0 ? "+" : ""}{deltas.vsWeek}</div>
      )}
    </div>
  );
}

export function PlaceholderColumn({ name, emoji, note, href }:
  { name: string; emoji: string; note: string; href?: string }) {
  return (
    <div className="flex-1 bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl p-4">
      <div className="font-bold border-b border-stone-200 pb-2 mb-2 text-stone-500">{emoji} {name}</div>
      <div className="text-2xl font-extrabold text-stone-300">—</div>
      <div className="text-xs text-stone-400 mb-2">{note}</div>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="block text-center text-xs bg-stone-200 hover:bg-stone-300 rounded-lg py-1.5 text-stone-600">
          abrir ↗
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Botón actualizar** — `web/src/components/RefreshButton.tsx`

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    await fetch("/api/refresh", { method: "POST" });
    router.refresh();
    setBusy(false);
  }
  return (
    <button onClick={refresh} disabled={busy}
      className="text-sm bg-emerald-700 text-white rounded-lg px-4 py-1.5 disabled:opacity-50">
      {busy ? "Actualizando…" : "● Actualizar datos"}
    </button>
  );
}
```

- [ ] **Step 4: Página Inicio** — reemplazar `web/src/app/page.tsx`

```tsx
import { createClient } from "@/lib/supabase/server";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import { PlatformColumn, PlaceholderColumn } from "@/components/PlatformColumn";
import RefreshButton from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("snapshots")
    .select("platform,snapshot_date,followers,total_views,posts_count")
    .gte("snapshot_date", since);
  const rows = (data ?? []) as SnapshotRow[];
  const youtube = computeDeltas(rows.filter((r) => r.platform === "youtube"));

  const fecha = new Date().toLocaleDateString("es-CO",
    { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Buenos días Gio 👋</h1>
          <p className="text-sm text-stone-400">{fecha}</p>
        </div>
        <RefreshButton />
      </div>

      <p className="text-[10px] tracking-widest text-stone-400 mb-2">
        ✦ TUS REDES — LADO A LADO
      </p>
      <div className="flex gap-3 mb-6">
        <PlaceholderColumn name="Instagram" emoji="📸" note="se conecta en Fase 4" />
        <PlaceholderColumn name="TikTok" emoji="🎵" note="se conecta en Fase 5" />
        <PlatformColumn name="YouTube" emoji="▶️" unit="suscriptores" deltas={youtube} />
        <PlaceholderColumn name="X / Twitter" emoji="𝕏" note="sin API"
          href="https://x.com" />
      </div>

      <p className="text-[10px] tracking-widest text-stone-400 mb-2">✦ ACCESOS RÁPIDOS</p>
      <div className="flex gap-3">
        {[
          ["💬 WhatsApp", "https://web.whatsapp.com"],
          ["𝕏 Twitter", "https://x.com"],
          ["🎮 Discord DMs", "https://discord.com/channels/@me"],
        ].map(([label, href]) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm shadow-sm hover:bg-stone-100">
            {label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verificar en local** — `npm run dev` → `/`: saludo + 4 columnas (YouTube con número real tras el refresh del Task 8) + accesos rápidos. Clic en "● Actualizar datos" → el "Actualizado hh:mm" del sidebar cambia.

- [ ] **Step 6: Correr todos los tests + lint**

Run: `npm test && npm run lint`
Expected: tests PASS, lint sin errores.

- [ ] **Step 7: Commit**

```bash
git add web && git commit -m "feat: Inicio panorámico con YouTube real"
```

---

### Task 10: Deploy a Vercel + verificación de producción

**Files:** ninguno nuevo (configuración en Vercel)

- [ ] **Step 1: Crear proyecto en Vercel** — `vercel.com/new` → importar el repo (subirlo a GitHub privado primero: `gh repo create dashboard-social --private --source . --push` desde la carpeta del proyecto) → **Root Directory: `web`** → framework Next.js.

- [ ] **Step 2: Variables de entorno en Vercel** — agregar las 7 de `.env.example` (Settings → Environment Variables, scope Production + Preview).

- [ ] **Step 3: Deploy y smoke test** — tras el deploy: abrir la URL → redirige a `/login` → entrar → Inicio con datos. Probar `/posts` ("próximamente") y el botón Actualizar.

- [ ] **Step 4: Verificar el cron** — Vercel → proyecto → Settings → Cron Jobs: debe aparecer `/api/cron/snapshot` a las 11:00 UTC. Ejecutarlo con "Run" manual y revisar en Supabase que la fila de hoy existe.

- [ ] **Step 5: Commit final de la fase** (si hubo ajustes) y marcar Fase 1 como desplegada en la bitácora.

```bash
git add -A && git commit -m "chore: cierre Fase 1 en producción"
```

---

## Autorevisión del plan (hecha)

- **Cobertura del spec (Fase 1):** esqueleto ✓ (T1, T5), Auth usuario único ✓ (T3-T4), sidebar 14 rubros + próximamente ✓ (T5), accesos rápidos ✓ (T9), YouTube + snapshots ✓ (T6-T8), Inicio panorámico ✓ (T9), cron aunque la Mac esté apagada ✓ (T8, T10), botón Actualizar datos ✓ (T8-T9). El Score y las alertas son Fase 6 (placeholder visible en sidebar).
- **Placeholders:** ninguno — todo paso tiene código o comando completo.
- **Consistencia de tipos:** `PlatformStats` (T6) la consume `runSnapshot` (T7); `SnapshotRow`/`Deltas` (T7) las consumen `PlatformColumn` y la página (T9); `NAV_ITEMS` (T5) lo usan Sidebar y `[section]`. Nombres verificados.
