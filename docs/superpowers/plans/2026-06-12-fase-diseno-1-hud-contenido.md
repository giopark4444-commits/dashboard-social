# Fase Diseño 1 — Jarvis HUD + UIs de Contenido (sin APIs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la cara visual de Vantage Studio sin tocar una sola API: el Jarvis HUD fullscreen con orbe animado, y las UIs completas (con datos demo marcados) de Hook Bank, Content Calendar, Carrusel Studio, Trend Scout y Video Analysis.

**Architecture:** Todo es frontend Next.js sobre el tema command-center existente (tokens: bg-background/surface/surface-2, border-border, text-bright/foreground/muted/dim/accent/ok/warn). Datos demo centralizados en `lib/demo-data.ts`. Cada página demo lleva el badge DEMO (patrón ya establecido). El orbe es canvas 2D puro — cero dependencias nuevas. Las páginas son rutas estáticas que ganan sobre `[section]` (patrón ya probado con `/agentes`).

**Contexto del pedido de Gio (2026-06-12):** "todo lo que sea APIs lo dejamos de último, mientras tanto concéntrate en el diseño". La capa IA (plan Fase 2, diferido) se enchufa después sobre estas UIs.

**Tech Stack:** Next.js 16.2.7, React 19, Tailwind v4, canvas 2D. SIN dependencias nuevas.

**Reglas del repo:** `web/AGENTS.md` (Next.js distinto al de entrenamiento); `params`/`cookies()` son Promise; `Date.now()` en render necesita `// eslint-disable-next-line react-hooks/purity`. npm desde `web/`; git desde la raíz. Rama: `vantage-diseno-1`.

---

### Task 1: Datos demo + componentes compartidos

**Files:**
- Create: `web/src/lib/demo-data.ts`
- Create: `web/src/components/PageHeader.tsx`
- Create: `web/src/components/DemoBadge.tsx`
- Test: `web/src/lib/__tests__/demo-data.test.ts`

- [ ] **Step 1: Test que falla** — `web/src/lib/__tests__/demo-data.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { DEMO_HOOKS, DEMO_TRENDS, DEMO_CALENDAR, DEMO_SLIDES, DEMO_VIDEO } from "@/lib/demo-data";

describe("demo-data", () => {
  it("hooks con ids únicos y tags", () => {
    expect(DEMO_HOOKS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(DEMO_HOOKS.map((h) => h.id)).size).toBe(DEMO_HOOKS.length);
    expect(DEMO_HOOKS.every((h) => h.tags.length > 0)).toBe(true);
  });

  it("trends con score 0-100", () => {
    expect(DEMO_TRENDS.every((t) => t.score >= 0 && t.score <= 100)).toBe(true);
  });

  it("calendario con días válidos y estados conocidos", () => {
    const estados = ["idea", "borrador", "aprobado", "publicado"];
    expect(DEMO_CALENDAR.every((c) => c.day >= 1 && c.day <= 28)).toBe(true);
    expect(DEMO_CALENDAR.every((c) => estados.includes(c.estado))).toBe(true);
  });

  it("carrusel y video no vacíos", () => {
    expect(DEMO_SLIDES.length).toBeGreaterThanOrEqual(4);
    expect(DEMO_VIDEO.segments.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Correr y ver que falla** → `npm test` FAIL.

- [ ] **Step 3: Implementar `web/src/lib/demo-data.ts`**

```ts
// Datos de ejemplo para las UIs en modo DEMO (la IA y las APIs llegan en la fase final).

export type DemoHook = { id: number; text: string; tags: string[]; score: number; fuente: string };
export const DEMO_HOOKS: DemoHook[] = [
  { id: 1, text: "Nadie te dice esto antes de abrir un negocio en Colombia…", tags: ["negocio", "curiosidad"], score: 92, fuente: "visto en Reels" },
  { id: 2, text: "Pagué 4 millones al mes en software hasta que hice esto", tags: ["negocio", "dolor"], score: 88, fuente: "propio" },
  { id: 3, text: "3 errores que matan tu bar antes del primer año", tags: ["bar", "lista"], score: 85, fuente: "propio" },
  { id: 4, text: "Esto me costó 2 años aprenderlo (te lo cuento en 40 segundos)", tags: ["historia", "curiosidad"], score: 83, fuente: "visto en TikTok" },
  { id: 5, text: "El truco del inventario que usan los restaurantes grandes", tags: ["bar", "valor"], score: 79, fuente: "propio" },
  { id: 6, text: "¿Por qué tu WhatsApp espanta clientes? (test de 10 segundos)", tags: ["whatsapp", "pregunta"], score: 76, fuente: "visto en Reels" },
  { id: 7, text: "Antes vs después de automatizar mi prospección", tags: ["saas", "antes-despues"], score: 74, fuente: "propio" },
  { id: 8, text: "La métrica que nadie mira y predice si tu contenido pega", tags: ["contenido", "curiosidad"], score: 71, fuente: "visto en YouTube" },
];

export type DemoTrend = { id: number; tema: string; tipo: "tema" | "audio" | "formato" | "hashtag"; score: number; nota: string };
export const DEMO_TRENDS: DemoTrend[] = [
  { id: 1, tema: "POV: emprendiendo en LATAM", tipo: "formato", score: 94, nota: "Formato POV con texto en pantalla, 15-25s. Encaja para Vendalo y marca personal." },
  { id: 2, tema: "audio 'así empezó todo' (remix)", tipo: "audio", score: 87, nota: "Audio en subida los últimos 4 días. Sirve para historia del bar." },
  { id: 3, tema: "#NegociosReales", tipo: "hashtag", score: 81, nota: "Hashtag con tracción en Colombia esta semana." },
  { id: 4, tema: "Day in the life: dueño de bar", tipo: "tema", score: 78, nota: "Vlogs cortos de operación real funcionan para 1060 Bar." },
  { id: 5, tema: "Carruseles 'esto vs esto'", tipo: "formato", score: 73, nota: "Comparativas visuales simples, alto save-rate." },
  { id: 6, tema: "IA para pymes (escepticismo)", tipo: "tema", score: 69, nota: "Ángulo contraintuitivo: 'la IA no te va a salvar si…'" },
];

export type DemoCalItem = { id: number; day: number; titulo: string; canal: string; estado: "idea" | "borrador" | "aprobado" | "publicado" };
export const DEMO_CALENDAR: DemoCalItem[] = [
  { id: 1, day: 2, titulo: "Reel: 3 errores de bar", canal: "IG", estado: "publicado" },
  { id: 2, day: 4, titulo: "Carrusel: Siigo vs tu app", canal: "IG", estado: "publicado" },
  { id: 3, day: 8, titulo: "Short: inventario en 60s", canal: "YT", estado: "aprobado" },
  { id: 4, day: 11, titulo: "Reel: POV emprendiendo", canal: "IG", estado: "borrador" },
  { id: 5, day: 15, titulo: "Video: tour del 1060", canal: "YT", estado: "borrador" },
  { id: 6, day: 18, titulo: "Carrusel: hooks que venden", canal: "IG", estado: "idea" },
  { id: 7, day: 22, titulo: "Short: demo Vendalo 45s", canal: "YT", estado: "idea" },
  { id: 8, day: 26, titulo: "Reel: antes/después prospección", canal: "IG", estado: "idea" },
];

export type DemoSlide = { id: number; titulo: string; cuerpo: string };
export const DEMO_SLIDES: DemoSlide[] = [
  { id: 1, titulo: "Pagué 4M/mes en software 😤", cuerpo: "Siigo + Soft Restaurant + nómina + …\n\nHasta que hice cuentas." },
  { id: 2, titulo: "El problema no es pagar", cuerpo: "Es pagar por 10 herramientas que no se hablan entre ellas." },
  { id: 3, titulo: "Qué hice", cuerpo: "Una sola app: POS + inventario + facturación + nómina.\n\nTodo conectado." },
  { id: 4, titulo: "El resultado", cuerpo: "De ~4M/mes a una fracción.\nY cero re-digitación." },
  { id: 5, titulo: "¿Tu negocio paga doble?", cuerpo: "Comenta 'CUENTAS' y te muestro cómo auditarlo en 10 min. →" },
];

export type DemoVideo = {
  titulo: string; duracion: string; hookScore: number;
  segments: { from: string; to: string; etiqueta: string; nota: string; fuerza: "alta" | "media" | "baja" }[];
  recomendaciones: string[];
};
export const DEMO_VIDEO: DemoVideo = {
  titulo: "Demo: 'El truco del inventario' (45s)",
  duracion: "0:45",
  hookScore: 82,
  segments: [
    { from: "0:00", to: "0:04", etiqueta: "Hook", nota: "Pregunta directa + texto en pantalla. Retiene.", fuerza: "alta" },
    { from: "0:04", to: "0:18", etiqueta: "Contexto", nota: "Un poco largo: 14s para llegar al valor.", fuerza: "media" },
    { from: "0:18", to: "0:38", etiqueta: "Valor", nota: "El truco explicado con demo en pantalla. Bien.", fuerza: "alta" },
    { from: "0:38", to: "0:45", etiqueta: "CTA", nota: "CTA suave ('sígueme'). Probar CTA de comentario.", fuerza: "baja" },
  ],
  recomendaciones: [
    "Recorta el contexto a ≤8s: entra al valor antes del segundo 12.",
    "Cambia el CTA a uno de comentario ('escribe INVENTARIO') para alimentar prospección.",
    "El hook funciona — guárdalo como variante en el Hook Bank.",
  ],
};
```

- [ ] **Step 4: Crear `web/src/components/DemoBadge.tsx`**

```tsx
export default function DemoBadge() {
  return (
    <span className="text-[9px] border border-warn/50 text-warn rounded px-1.5 py-0.5 align-middle">
      DEMO
    </span>
  );
}
```

- [ ] **Step 5: Crear `web/src/components/PageHeader.tsx`**

```tsx
import DemoBadge from "@/components/DemoBadge";

export default function PageHeader({ kicker, title, demo, children }: {
  kicker: string; title: string; demo?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div>
        <p className="text-[10px] tracking-[0.25em] text-accent">✦ {kicker}</p>
        <h1 className="text-2xl font-extrabold text-bright tracking-wider">
          {title} {demo && <DemoBadge />}
        </h1>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Correr tests** → PASS. **Step 7: Commit**

```bash
git add web/src/lib/demo-data.ts web/src/lib/__tests__/demo-data.test.ts web/src/components/DemoBadge.tsx web/src/components/PageHeader.tsx
git commit -m "feat: datos demo y componentes compartidos de página"
```

---

### Task 2: Orbe Jarvis (canvas 2D)

**Files:**
- Create: `web/src/components/JarvisOrb.tsx`

- [ ] **Step 1: Implementar `web/src/components/JarvisOrb.tsx`**

```tsx
"use client";
import { useEffect, useRef } from "react";

/** Orbe animado del HUD: núcleo pulsante + anillos de onda + partículas en órbita. Canvas 2D puro. */
export default function JarvisOrb({ size = 280 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2;
    let raf = 0;
    const start = performance.now();

    function draw(now: number) {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, size, size);

      // halo
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      halo.addColorStop(0, "rgba(79,140,255,0.25)");
      halo.addColorStop(0.6, "rgba(79,140,255,0.06)");
      halo.addColorStop(1, "rgba(79,140,255,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // anillos de onda (radio modulado por seno — simula audio-reactividad)
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
          const wob = Math.sin(a * (5 + ring * 2) + t * (1.2 + ring * 0.5)) * (4 + ring * 2);
          const r = size * 0.22 + ring * 14 + wob + Math.sin(t * 1.5) * 3;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(79,140,255,${0.45 - ring * 0.13})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // núcleo
      const pulse = 1 + Math.sin(t * 2) * 0.06;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.16 * pulse);
      core.addColorStop(0, "rgba(232,240,255,0.95)");
      core.addColorStop(0.4, "rgba(79,140,255,0.8)");
      core.addColorStop(1, "rgba(79,140,255,0.05)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.16 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // partículas en órbita
      for (let i = 0; i < 14; i++) {
        const ang = t * (0.3 + (i % 5) * 0.12) + (i * Math.PI * 2) / 14;
        const r = size * 0.34 + Math.sin(t + i) * 8;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.92, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(143,163,200,0.8)";
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden />;
}
```

- [ ] **Step 2: Verificar build** → `npm run build` verde. **Step 3: Commit**

```bash
git add web/src/components/JarvisOrb.tsx
git commit -m "feat: orbe Jarvis animado en canvas 2D"
```

---

### Task 3: Jarvis HUD fullscreen

**Files:**
- Create: `web/src/components/JarvisConsole.tsx`
- Create: `web/src/app/jarvis/page.tsx`

- [ ] **Step 1: Crear `web/src/components/JarvisConsole.tsx`** (consola de texto del HUD; en modo demo responde fijo — el cerebro real llega en la fase de APIs)

```tsx
"use client";
import { useState } from "react";

type Line = { who: "tú" | "jarvis"; text: string };
const DEMO_REPLY =
  "Sistemas visuales en línea. El cerebro (API de Claude) se conecta en la fase final — por ahora registro tu mensaje y me veo épico.";

export default function JarvisConsole() {
  const [lines, setLines] = useState<Line[]>([
    { who: "jarvis", text: "J.A.R.V.I.S. operativo. ¿En qué trabajamos hoy?" },
  ]);
  const [input, setInput] = useState("");

  function send() {
    const text = input.trim();
    if (!text) return;
    setLines((l) => [...l, { who: "tú", text }, { who: "jarvis", text: DEMO_REPLY }]);
    setInput("");
  }

  return (
    <div className="w-full max-w-xl">
      <div className="max-h-40 overflow-y-auto space-y-1 mb-3 px-1">
        {lines.slice(-6).map((l, i) => (
          <p key={i} className="text-sm">
            <span className={l.who === "jarvis" ? "text-accent" : "text-dim"}>{l.who === "jarvis" ? "◉ " : "▸ "}</span>
            <span className={l.who === "jarvis" ? "text-foreground" : "text-muted"}>{l.text}</span>
          </p>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Habla con J.A.R.V.I.S.…"
          className="flex-1 bg-surface/80 border border-accent/30 rounded-lg px-4 py-2 text-sm text-bright placeholder:text-dim backdrop-blur" />
        <button onClick={send} disabled={!input.trim()}
          className="bg-accent/20 border border-accent/50 text-bright rounded-lg px-4 disabled:opacity-40">➤</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `web/src/app/jarvis/page.tsx`**

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import JarvisOrb from "@/components/JarvisOrb";
import JarvisConsole from "@/components/JarvisConsole";

export const dynamic = "force-dynamic";

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 bg-surface/40 rounded-lg px-4 py-3 backdrop-blur">
      <div className="text-[9px] tracking-[0.2em] text-dim uppercase">{label}</div>
      <div className="text-xl font-extrabold text-bright">{value}</div>
    </div>
  );
}

export default async function JarvisPage() {
  const supabase = await createClient();
  const brand = await getActiveBrand();
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: snaps }, { count: autoAgents }] = await Promise.all([
    supabase.from("snapshots")
      .select("platform,snapshot_date,followers,total_views,posts_count")
      .eq("brand_id", brand.id).gte("snapshot_date", since),
    supabase.from("agent_settings")
      .select("agent_id", { count: "exact", head: true })
      .eq("brand_id", brand.id).neq("autonomy", "manual"),
  ]);
  const youtube = computeDeltas(((snaps ?? []) as SnapshotRow[]).filter((r) => r.platform === "youtube"));

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* rejilla de fondo */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(#4f8cff 1px, transparent 1px), linear-gradient(90deg, #4f8cff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <Link href="/" className="absolute top-5 left-6 text-dim hover:text-muted text-sm z-10">← salir</Link>
      <div className="absolute top-5 right-6 text-[10px] tracking-[0.25em] text-dim z-10">
        MARCA: <span className="text-accent">{brand.name.toUpperCase()}</span>
      </div>

      <p className="text-[10px] tracking-[0.4em] text-accent mb-2 z-10">✦ COMMAND CENTER · VANTAGE STUDIO</p>
      <h1 className="text-4xl font-extrabold text-bright tracking-[0.2em] mb-6 z-10">J.A.R.V.I.S.</h1>

      <div className="flex items-center gap-10 z-10">
        <div className="hidden md:flex flex-col gap-3">
          <Readout label="Suscriptores YT" value={youtube.current?.toLocaleString("es-CO") ?? "—"} />
          <Readout label="Vs ayer" value={youtube.vsYesterday != null ? `${youtube.vsYesterday >= 0 ? "+" : ""}${youtube.vsYesterday}` : "—"} />
        </div>
        <JarvisOrb size={300} />
        <div className="hidden md:flex flex-col gap-3">
          <Readout label="Agentes activos" value={String(autoAgents ?? 0)} />
          <Readout label="Voz" value="FASE FINAL" />
        </div>
      </div>

      <div className="mt-8 z-10 w-full flex justify-center px-6">
        <JarvisConsole />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar** → `npm run build && npm test` verdes. **Step 4: Commit**

```bash
git add web/src/components/JarvisConsole.tsx web/src/app/jarvis/page.tsx
git commit -m "feat: Jarvis HUD fullscreen con orbe, readouts y consola"
```

---

### Task 4: Hook Bank

**Files:**
- Create: `web/src/components/HookGrid.tsx`
- Create: `web/src/app/hooks/page.tsx`

- [ ] **Step 1: Crear `web/src/components/HookGrid.tsx`** (filtro por tag, client-side)

```tsx
"use client";
import { useState } from "react";
import { DEMO_HOOKS } from "@/lib/demo-data";

export default function HookGrid() {
  const [tag, setTag] = useState<string | null>(null);
  const tags = [...new Set(DEMO_HOOKS.flatMap((h) => h.tags))].sort();
  const hooks = tag ? DEMO_HOOKS.filter((h) => h.tags.includes(tag)) : DEMO_HOOKS;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTag(null)}
          className={`text-xs rounded-full px-3 py-1 border ${tag === null ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
          todos
        </button>
        {tags.map((t) => (
          <button key={t} onClick={() => setTag(t)}
            className={`text-xs rounded-full px-3 py-1 border ${tag === t ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
            #{t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {hooks.map((h) => (
          <div key={h.id} className="bg-surface border border-border rounded-xl p-4 hover:border-accent/40">
            <div className="flex items-start gap-3">
              <div className="text-2xl font-extrabold text-accent w-12 shrink-0">{h.score}</div>
              <div className="flex-1">
                <p className="text-sm text-bright leading-snug">“{h.text}”</p>
                <div className="flex gap-2 mt-2 items-center">
                  {h.tags.map((t) => (
                    <span key={t} className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5">#{t}</span>
                  ))}
                  <span className="text-[9px] text-dim ml-auto">{h.fuente}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Crear `web/src/app/hooks/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import HookGrid from "@/components/HookGrid";

export default function HooksPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader kicker="CONTENIDO" title="HOOK BANK" demo />
      <p className="text-xs text-dim mb-5">
        Tu banco de ganchos con score. En la fase final, Hook Hunter (IA) generará variantes por marca y los clasificará solo.
      </p>
      <HookGrid />
    </div>
  );
}
```

- [ ] **Step 3: Verificar** → build + tests verdes. **Step 4: Commit**

```bash
git add web/src/components/HookGrid.tsx web/src/app/hooks/page.tsx
git commit -m "feat: UI del Hook Bank con filtro por tags (demo)"
```

---

### Task 5: Content Calendar

**Files:**
- Create: `web/src/app/calendario/page.tsx`

- [ ] **Step 1: Crear `web/src/app/calendario/page.tsx`** (grid mensual del mes actual con items demo)

```tsx
import PageHeader from "@/components/PageHeader";
import { DEMO_CALENDAR } from "@/lib/demo-data";

const ESTADO_STYLE: Record<string, string> = {
  idea: "border-dim text-dim",
  borrador: "border-warn/60 text-warn",
  aprobado: "border-accent/60 text-accent",
  publicado: "border-ok/60 text-ok",
};

export default function CalendarioPage() {
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lunes=0
  const monthName = now.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader kicker="CONTENIDO" title="CONTENT CALENDAR" demo />
      <p className="text-xs text-dim mb-2">
        Calendario editorial · <span className="capitalize text-muted">{monthName}</span>. En la fase final, el CMO propondrá huecos y fechas.
      </p>
      <div className="flex gap-3 mb-4 text-[10px]">
        {Object.entries(ESTADO_STYLE).map(([estado, cls]) => (
          <span key={estado} className={`border rounded px-1.5 py-0.5 ${cls}`}>{estado}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-[10px] text-dim tracking-widest mb-1">
        {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => <div key={d} className="px-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => (
          <div key={i} className={`min-h-24 rounded-lg border p-1.5 ${day ? "bg-surface border-border" : "border-transparent"}`}>
            {day && (
              <>
                <div className={`text-[10px] mb-1 ${day === now.getDate() ? "text-accent font-bold" : "text-dim"}`}>{day}</div>
                {DEMO_CALENDAR.filter((c) => c.day === day).map((c) => (
                  <div key={c.id} className={`text-[10px] border rounded px-1.5 py-1 mb-1 leading-tight ${ESTADO_STYLE[c.estado]}`}>
                    <span className="text-muted">{c.canal}</span> · {c.titulo}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** → build + tests verdes. **Step 3: Commit**

```bash
git add web/src/app/calendario/page.tsx
git commit -m "feat: UI del Content Calendar mensual (demo)"
```

---

### Task 6: Carrusel Studio

**Files:**
- Create: `web/src/components/CarruselEditor.tsx`
- Create: `web/src/app/carrusel/page.tsx`

- [ ] **Step 1: Crear `web/src/components/CarruselEditor.tsx`** (lista de slides + preview 4:5 estilo IG)

```tsx
"use client";
import { useState } from "react";
import { DEMO_SLIDES } from "@/lib/demo-data";

export default function CarruselEditor() {
  const [sel, setSel] = useState(0);
  const slide = DEMO_SLIDES[sel];

  return (
    <div className="flex flex-col md:flex-row gap-5">
      <div className="md:w-64 space-y-2">
        {DEMO_SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setSel(i)}
            className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${i === sel ? "border-accent bg-surface-2 text-bright" : "border-border bg-surface text-muted hover:border-accent/40"}`}>
            <span className="text-[10px] text-dim mr-2">{i + 1}/{DEMO_SLIDES.length}</span>
            {s.titulo}
          </button>
        ))}
        <p className="text-[10px] text-dim pt-1">
          En la fase final: escribes un hook o tema y Carrusel Writer (IA) genera los slides.
        </p>
      </div>

      {/* preview 4:5 */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-sm aspect-[4/5] rounded-2xl border border-border bg-gradient-to-b from-surface-2 to-surface p-8 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #4f8cff, transparent 60%)" }} />
          <div className="text-[10px] tracking-[0.25em] text-accent mb-auto z-10">▣ VANTAGE</div>
          <h2 className="text-2xl font-extrabold text-bright leading-tight mb-4 z-10">{slide.titulo}</h2>
          <p className="text-sm text-muted whitespace-pre-wrap z-10">{slide.cuerpo}</p>
          <div className="mt-auto flex justify-between items-center z-10">
            <span className="text-[10px] text-dim">@giopark</span>
            <span className="text-[10px] text-dim">{sel + 1} / {DEMO_SLIDES.length} →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `web/src/app/carrusel/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import CarruselEditor from "@/components/CarruselEditor";

export default function CarruselPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader kicker="CONTENIDO" title="CARRUSEL STUDIO" demo />
      <p className="text-xs text-dim mb-5">Diseña carruseles con preview 4:5 listo para Instagram.</p>
      <CarruselEditor />
    </div>
  );
}
```

- [ ] **Step 3: Verificar** → build + tests verdes. **Step 4: Commit**

```bash
git add web/src/components/CarruselEditor.tsx web/src/app/carrusel/page.tsx
git commit -m "feat: UI del Carrusel Studio con preview 4:5 (demo)"
```

---

### Task 7: Trend Scout

**Files:**
- Create: `web/src/app/trends/page.tsx`

- [ ] **Step 1: Crear `web/src/app/trends/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import { DEMO_TRENDS } from "@/lib/demo-data";

const TIPO_ICON: Record<string, string> = { tema: "◈", audio: "♫", formato: "▣", hashtag: "#" };

export default function TrendsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="CONTENIDO" title="TREND SCOUT" demo />
      <p className="text-xs text-dim mb-5">
        Radar de tendencias. En la fase final, el runner las rastrea solo y la IA filtra lo relevante para cada marca.
      </p>
      <div className="space-y-2">
        {DEMO_TRENDS.map((t) => (
          <div key={t.id} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
            <span className="text-accent text-lg w-6 text-center shrink-0">{TIPO_ICON[t.tipo]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-bright truncate">{t.tema}</span>
                <span className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5 uppercase shrink-0">{t.tipo}</span>
              </div>
              <p className="text-xs text-muted mt-0.5">{t.nota}</p>
            </div>
            <div className="w-28 shrink-0">
              <div className="flex justify-between text-[10px] text-dim mb-1"><span>score</span><span className="text-bright">{t.score}</span></div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${t.score}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** → build + tests verdes. **Step 3: Commit**

```bash
git add web/src/app/trends/page.tsx
git commit -m "feat: UI del Trend Scout con scores (demo)"
```

---

### Task 8: Video Analysis

**Files:**
- Create: `web/src/app/video/page.tsx`

- [ ] **Step 1: Crear `web/src/app/video/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import { DEMO_VIDEO } from "@/lib/demo-data";

const FUERZA_CLS: Record<string, string> = { alta: "bg-ok", media: "bg-warn", baja: "bg-red-400" };

export default function VideoPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="CONTENIDO" title="VIDEO ANALYSIS" demo />
      <p className="text-xs text-dim mb-5">
        Desglose de un video: hook, estructura, ritmo y CTA. En la fase final subirás cualquier video (tuyo o de la competencia) y la IA lo analiza.
      </p>

      <div className="bg-surface border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-bright">{DEMO_VIDEO.titulo}</div>
            <div className="text-xs text-dim">duración {DEMO_VIDEO.duracion}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-accent">{DEMO_VIDEO.hookScore}</div>
            <div className="text-[9px] tracking-widest text-dim uppercase">hook score</div>
          </div>
        </div>

        {/* línea de tiempo */}
        <div className="flex h-2 rounded-full overflow-hidden mb-4">
          {DEMO_VIDEO.segments.map((s, i) => (
            <div key={i} className={`${FUERZA_CLS[s.fuerza]} opacity-80`} style={{ flex: 1 }} title={s.etiqueta} />
          ))}
        </div>

        <div className="space-y-3">
          {DEMO_VIDEO.segments.map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-[10px] text-dim w-20 shrink-0 pt-0.5">{s.from}–{s.to}</span>
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${FUERZA_CLS[s.fuerza]}`} />
              <div>
                <span className="text-sm font-bold text-bright">{s.etiqueta}</span>
                <p className="text-xs text-muted">{s.nota}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] tracking-widest text-dim mb-2">✦ RECOMENDACIONES</p>
      <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
        {DEMO_VIDEO.recomendaciones.map((r, i) => (
          <p key={i} className="text-sm text-foreground">▸ {r}</p>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** → build + tests verdes. **Step 3: Commit**

```bash
git add web/src/app/video/page.tsx
git commit -m "feat: UI de Video Analysis con timeline (demo)"
```

---

### Task 9: Nav actualizado + verificación final + deploy

**Files:**
- Modify: `web/src/lib/nav.ts` (los módulos con página propia pierden su etiqueta de fase)

- [ ] **Step 1: En `nav.ts`, quitar `phase` SOLO de estas líneas** (ya tienen UI real; lo demás queda igual):

```ts
  { slug: "calendario",  label: "Content Calendar", icon: "▦", group: "contenido" },
  { slug: "carrusel",    label: "Carrusel Studio",  icon: "❏", group: "contenido" },
  { slug: "hooks",       label: "Hook Bank",        icon: "⚓", group: "contenido" },
  { slug: "trends",      label: "Trend Scout",      icon: "≈", group: "contenido" },
  { slug: "video",       label: "Video Analysis",   icon: "◬", group: "contenido" },
  { slug: "jarvis",      label: "Jarvis HUD",       icon: "◉", group: "inteligencia" },
```

- [ ] **Step 2: Suite completa** → `npm test && npm run lint && npm run build` todo verde.

- [ ] **Step 3: Prueba manual en dev** → `npm run dev`: `/jarvis` muestra el HUD fullscreen con orbe animado y consola; `/hooks` filtra por tag; `/calendario` pinta el mes actual; `/carrusel` cambia slides en el preview; `/trends` y `/video` renderizan. Todas con badge DEMO.

- [ ] **Step 4: Merge y push**

```bash
git checkout main && git merge --no-ff vantage-diseno-1 -m "Fase Diseño 1: Jarvis HUD + UIs de contenido (demo, sin APIs)"
git push origin main
```

- [ ] **Step 5: Verificar producción** — poll hasta ver el deploy nuevo y revisar las rutas.

**Pendiente para Fase Diseño 2 (siguiente plan):** Inbox, Prospección, Ventas, Audit Inbox, Ajustes y Daily Brief en modo demo.
