# Fase Diseño 2 — Centro, Crecimiento e Inteligencia (sin APIs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar la cara visual de Vantage Studio: UIs demo de Daily Brief, Inbox, Prospección, Ventas, Audit Inbox y Ajustes. Cero APIs (orden de Gio: APIs al final).

**Architecture:** Mismo patrón de la Fase Diseño 1: rutas estáticas que ganan sobre `[section]`, datos demo en `lib/demo-data.ts` (se amplía), `PageHeader`/`DemoBadge` compartidos, tokens del tema (bg-surface/surface-2, border-border, text-bright/foreground/muted/dim/accent/ok/warn). Única excepción "real": Ajustes lee la PRESENCIA de variables de entorno (sin llamar nada) para mostrar el estado de conexiones.

**Tech Stack:** Next.js 16.2.7, React 19, Tailwind v4. SIN dependencias nuevas.

**Reglas del repo:** `web/AGENTS.md`; `cookies()`/`params` son Promise; npm desde `web/`; git desde la raíz. Rama: `vantage-diseno-2`.

---

### Task 1: Datos demo v2

**Files:**
- Modify: `web/src/lib/demo-data.ts` (agregar al final)
- Modify: `web/src/lib/__tests__/demo-data.test.ts` (agregar tests)

- [ ] **Step 1: Agregar tests al final del describe existente** en `demo-data.test.ts` — primero agrega los imports nuevos a la línea de import existente:

```ts
import { DEMO_HOOKS, DEMO_TRENDS, DEMO_CALENDAR, DEMO_SLIDES, DEMO_VIDEO, DEMO_BRIEF, DEMO_INBOX, DEMO_PROSPECTS, DEMO_DEALS, DEMO_AUDITS } from "@/lib/demo-data";
```

y dentro del `describe("demo-data", ...)` agrega:

```ts
  it("brief con máximo 3 acciones", () => {
    expect(DEMO_BRIEF.acciones.length).toBeLessThanOrEqual(3);
    expect(DEMO_BRIEF.alertas.length).toBeGreaterThan(0);
  });

  it("inbox con canales y estados válidos", () => {
    expect(DEMO_INBOX.length).toBeGreaterThanOrEqual(5);
    expect(DEMO_INBOX.every((i) => ["IG", "YT", "WA"].includes(i.canal))).toBe(true);
    expect(DEMO_INBOX.every((i) => ["pendiente", "respondido"].includes(i.estado))).toBe(true);
  });

  it("prospects con etapas válidas e ids únicos", () => {
    const etapas = ["nuevo", "contactado", "interesado", "cliente"];
    expect(DEMO_PROSPECTS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(DEMO_PROSPECTS.map((p) => p.id)).size).toBe(DEMO_PROSPECTS.length);
    expect(DEMO_PROSPECTS.every((p) => etapas.includes(p.etapa))).toBe(true);
  });

  it("deals con etapas del pipeline y valor positivo", () => {
    const etapas = ["lead", "contactado", "demo", "cierre"];
    expect(DEMO_DEALS.every((d) => etapas.includes(d.etapa) && d.valor > 0)).toBe(true);
  });

  it("audits con hallazgos priorizados", () => {
    expect(DEMO_AUDITS.length).toBeGreaterThanOrEqual(2);
    expect(DEMO_AUDITS.every((a) => a.hallazgos.length > 0 && a.score >= 0 && a.score <= 100)).toBe(true);
  });
```

- [ ] **Step 2: Correr y ver que falla** → `npm test` FAIL (exports no existen).

- [ ] **Step 3: Agregar al FINAL de `web/src/lib/demo-data.ts`:**

```ts
export type DemoBrief = { resumen: string; alertas: { severidad: "info" | "warn"; texto: string }[]; acciones: string[]; oportunidad: string };
export const DEMO_BRIEF: DemoBrief = {
  resumen: "Semana estable en YouTube con momentum leve. El cuello de botella sigue siendo la frecuencia de publicación: 2 de 4 contenidos planeados salieron.",
  alertas: [
    { severidad: "warn", texto: "Instagram lleva 6 días sin publicar — el calendario tiene 3 piezas en borrador." },
    { severidad: "info", texto: "El Reel del martes superó 2x tu mediana de views en 48h." },
  ],
  acciones: [
    "Publica hoy el carrusel 'Siigo vs tu app' (ya está aprobado en el calendario).",
    "Graba la variante del hook #2 del Hook Bank mientras el tema tiene momentum.",
    "Responde los 3 DMs pendientes del Inbox — dos parecen prospectos calientes.",
  ],
  oportunidad: "El formato 'POV: emprendiendo en LATAM' (Trend Scout, score 94) encaja perfecto con tu historia de dejar Siigo. Guión de 20s: gancho con la factura de 4M → corte a la app propia.",
};

export type DemoInboxItem = { id: number; canal: "IG" | "YT" | "WA"; tipo: "comentario" | "dm" | "mención"; de: string; texto: string; sugerencia: string; estado: "pendiente" | "respondido"; hace: string };
export const DEMO_INBOX: DemoInboxItem[] = [
  { id: 1, canal: "IG", tipo: "dm", de: "@cafetera.bogota", texto: "Hola! Vi tu video del inventario. ¿La app sirve para una cafetería?", sugerencia: "¡Claro! Está pensada para cualquier negocio con inventario. ¿Cuántos puntos de venta tienes? Te muestro cómo quedaría para tu cafetería.", estado: "pendiente", hace: "hace 2 h" },
  { id: 2, canal: "YT", tipo: "comentario", de: "Andrés M.", texto: "¿Esto reemplaza completamente a Siigo? ¿Y la facturación electrónica?", sugerencia: "La facturación electrónica está en el roadmap con proveedor tecnológico DIAN. Hoy cubre POS + inventario + nómina. Te avisamos al lanzarla.", estado: "pendiente", hace: "hace 5 h" },
  { id: 3, canal: "WA", tipo: "dm", de: "+57 301 •• 42", texto: "Buenas, ¿precio para 2 bares?", sugerencia: "¡Hola! Para 2 sedes el plan queda en $X/mes con todo incluido. ¿Te agendo una demo de 15 min esta semana?", estado: "pendiente", hace: "hace 8 h" },
  { id: 4, canal: "IG", tipo: "comentario", de: "@valen_rojas", texto: "El antes y después 🔥🔥", sugerencia: "🙌 ¡Gracias! Si quieres ver cómo quedó por dentro, el video completo está en el canal.", estado: "respondido", hace: "ayer" },
  { id: 5, canal: "IG", tipo: "mención", de: "@emprendecol", texto: "Buen caso de estudio de @giopark sobre dejar el software tradicional", sugerencia: "¡Gracias por compartirlo! 🚀", estado: "respondido", hace: "ayer" },
  { id: 6, canal: "YT", tipo: "comentario", de: "Laura P.", texto: "¿Hay versión de prueba?", sugerencia: "Sí — 14 días gratis sin tarjeta. Link en la descripción. Cualquier duda me escribes.", estado: "pendiente", hace: "hace 2 días" },
];

export type DemoProspect = { id: number; nombre: string; handle: string; fuente: string; etapa: "nuevo" | "contactado" | "interesado" | "cliente"; tags: string[] };
export const DEMO_PROSPECTS: DemoProspect[] = [
  { id: 1, nombre: "Cafetera Bogotá", handle: "@cafetera.bogota", fuente: "DM Instagram", etapa: "interesado", tags: ["cafetería", "2 sedes"] },
  { id: 2, nombre: "Andrés Mejía", handle: "youtube", fuente: "Comentario YT", etapa: "nuevo", tags: ["facturación"] },
  { id: 3, nombre: "Bar La Cumbre", handle: "+57 301···", fuente: "WhatsApp", etapa: "interesado", tags: ["bar", "2 sedes"] },
  { id: 4, nombre: "Panadería El Trigal", handle: "@eltrigal.pan", fuente: "DM Instagram", etapa: "contactado", tags: ["panadería"] },
  { id: 5, nombre: "Diana Torres", handle: "@diana.eventos", fuente: "Mención IG", etapa: "nuevo", tags: ["eventos"] },
  { id: 6, nombre: "Ferretería Central", handle: "+57 315···", fuente: "Referido", etapa: "contactado", tags: ["ferretería", "vertical"] },
  { id: 7, nombre: "Café Madrugón", handle: "@madrugon.cafe", fuente: "DM Instagram", etapa: "cliente", tags: ["cafetería"] },
  { id: 8, nombre: "Hostal Nómada", handle: "booking", fuente: "Web", etapa: "nuevo", tags: ["hospedaje"] },
  { id: 9, nombre: "Parqueadero 93", handle: "+57 310···", fuente: "Referido", etapa: "nuevo", tags: ["parqueadero", "vertical"] },
  { id: 10, nombre: "Restaurante Doña Ana", handle: "@dona.ana", fuente: "Comentario IG", etapa: "contactado", tags: ["restaurante"] },
];

export type DemoDeal = { id: number; nombre: string; valor: number; etapa: "lead" | "contactado" | "demo" | "cierre"; nota: string };
export const DEMO_DEALS: DemoDeal[] = [
  { id: 1, nombre: "Bar La Cumbre (2 sedes)", valor: 380_000, etapa: "demo", nota: "Demo agendada jueves 7pm" },
  { id: 2, nombre: "Cafetera Bogotá", valor: 190_000, etapa: "contactado", nota: "Pidió precios por DM" },
  { id: 3, nombre: "Panadería El Trigal", valor: 190_000, etapa: "contactado", nota: "Respondió interesada, falta llamada" },
  { id: 4, nombre: "Ferretería Central", valor: 250_000, etapa: "lead", nota: "Referido de Café Madrugón" },
  { id: 5, nombre: "Restaurante Doña Ana", valor: 190_000, etapa: "lead", nota: "Comentó en el Reel del POS" },
  { id: 6, nombre: "Café Madrugón", valor: 190_000, etapa: "cierre", nota: "✓ Cliente desde mayo — referencia activa" },
];

export type DemoAudit = { id: number; canal: string; fecha: string; score: number; resumen: string; hallazgos: { prioridad: "alta" | "media" | "baja"; texto: string }[]; acciones: string[] };
export const DEMO_AUDITS: DemoAudit[] = [
  {
    id: 1, canal: "Instagram", fecha: "2026-06-10", score: 64,
    resumen: "Perfil sólido pero subutilizado: buen contenido, frecuencia irregular y bio sin CTA claro.",
    hallazgos: [
      { prioridad: "alta", texto: "La bio no dice qué haces ni tiene CTA — los visitantes no saben qué hacer después de un Reel viral." },
      { prioridad: "alta", texto: "Frecuencia irregular: 8 días sin publicar después de tu mejor semana." },
      { prioridad: "media", texto: "Los carruseles tienen 3x el save-rate de los Reels pero son solo el 15% del contenido." },
      { prioridad: "baja", texto: "Historias sin destacados organizados por tema." },
    ],
    acciones: ["Reescribe la bio: qué haces + para quién + CTA al link.", "Calendario mínimo viable: 3 piezas/semana, ya cargadas en el Content Calendar.", "Sube la cuota de carruseles al 40% del mix."],
  },
  {
    id: 2, canal: "YouTube", fecha: "2026-06-03", score: 71,
    resumen: "Canal con buena retención pero pocos puntos de entrada: faltan títulos buscables.",
    hallazgos: [
      { prioridad: "alta", texto: "Títulos cuentan la historia pero nadie los busca — cero tráfico de búsqueda." },
      { prioridad: "media", texto: "Sin pantallas finales enlazando al siguiente video: se pierde sesión." },
    ],
    acciones: ["Reformula títulos con la fórmula problema+especificidad.", "Agrega pantallas finales a los últimos 5 videos."],
  },
];
```

- [ ] **Step 4: Correr tests** → PASS (22 tests). **Step 5: Commit**

```bash
git add web/src/lib/demo-data.ts web/src/lib/__tests__/demo-data.test.ts
git commit -m "feat: datos demo v2 — brief, inbox, prospects, deals, audits"
```

---

### Task 2: Daily Brief (demo)

**Files:**
- Create: `web/src/app/brief/page.tsx`

- [ ] **Step 1: Crear `web/src/app/brief/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import { DEMO_BRIEF } from "@/lib/demo-data";

export default function BriefPage() {
  const hoy = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="CENTRO" title="DAILY BRIEF" demo>
        <span className="text-xs text-dim capitalize">{hoy}</span>
      </PageHeader>
      <p className="text-xs text-dim mb-5">
        El parte del día. En la fase final, el CMO Agent lo genera cada mañana a las 6:30 con tus datos reales.
      </p>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <section>
          <p className="text-[10px] tracking-widest text-dim mb-1">✦ RESUMEN</p>
          <p className="text-sm text-foreground">{DEMO_BRIEF.resumen}</p>
        </section>

        <section>
          <p className="text-[10px] tracking-widest text-dim mb-1">✦ ALERTAS</p>
          <div className="space-y-1">
            {DEMO_BRIEF.alertas.map((a, i) => (
              <p key={i} className={`text-sm ${a.severidad === "warn" ? "text-warn" : "text-muted"}`}>● {a.texto}</p>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] tracking-widest text-dim mb-1">✦ QUÉ HACER HOY</p>
          <ol className="space-y-1.5">
            {DEMO_BRIEF.acciones.map((a, i) => (
              <li key={i} className="text-sm text-bright flex gap-2">
                <span className="text-accent font-bold shrink-0">{i + 1}.</span> {a}
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-border pt-4">
          <p className="text-[10px] tracking-widest text-accent mb-1">✦ OPORTUNIDAD</p>
          <p className="text-sm text-foreground">{DEMO_BRIEF.oportunidad}</p>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** → `npm run build && npm test` verdes. **Step 3: Commit**

```bash
git add web/src/app/brief/page.tsx
git commit -m "feat: UI del Daily Brief (demo)"
```

---

### Task 3: Inbox unificado

**Files:**
- Create: `web/src/components/InboxList.tsx`
- Create: `web/src/app/inbox/page.tsx`

- [ ] **Step 1: Crear `web/src/components/InboxList.tsx`**

```tsx
"use client";
import { useState } from "react";
import { DEMO_INBOX } from "@/lib/demo-data";

const CANAL_ICON: Record<string, string> = { IG: "◎", YT: "▶", WA: "✆" };

export default function InboxList() {
  const [canal, setCanal] = useState<string | null>(null);
  const canales = ["IG", "YT", "WA"];
  const items = canal ? DEMO_INBOX.filter((i) => i.canal === canal) : DEMO_INBOX;
  const pendientes = DEMO_INBOX.filter((i) => i.estado === "pendiente").length;

  return (
    <>
      <div className="flex gap-2 mb-4 items-center">
        <button onClick={() => setCanal(null)}
          className={`text-xs rounded-full px-3 py-1 border ${canal === null ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
          todos
        </button>
        {canales.map((c) => (
          <button key={c} onClick={() => setCanal(c)}
            className={`text-xs rounded-full px-3 py-1 border ${canal === c ? "border-accent text-accent" : "border-border text-dim hover:text-muted"}`}>
            {CANAL_ICON[c]} {c}
          </button>
        ))}
        <span className="ml-auto text-xs text-warn">{pendientes} pendientes</span>
      </div>

      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className={`bg-surface border rounded-xl p-4 ${m.estado === "pendiente" ? "border-border" : "border-border/40 opacity-60"}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-accent">{CANAL_ICON[m.canal]}</span>
              <span className="text-sm font-bold text-bright">{m.de}</span>
              <span className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5 uppercase">{m.tipo}</span>
              <span className="text-[10px] text-dim ml-auto">{m.hace}</span>
            </div>
            <p className="text-sm text-foreground mb-2">{m.texto}</p>
            <div className="bg-surface-2 border border-accent/20 rounded-lg p-3">
              <p className="text-[9px] tracking-widest text-accent mb-1">◉ RESPUESTA SUGERIDA (IA EN FASE FINAL)</p>
              <p className="text-xs text-muted">{m.sugerencia}</p>
              {m.estado === "pendiente" && (
                <div className="flex gap-2 mt-2">
                  <button className="text-xs bg-accent/20 border border-accent/50 text-bright rounded px-3 py-1">Aprobar y enviar</button>
                  <button className="text-xs border border-border text-dim rounded px-3 py-1">Editar</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Crear `web/src/app/inbox/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import InboxList from "@/components/InboxList";

export default function InboxPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="CENTRO" title="INBOX" demo />
      <p className="text-xs text-dim mb-5">
        Comentarios, DMs y menciones de todos tus canales en una sola bandeja, con respuesta sugerida lista para aprobar.
      </p>
      <InboxList />
    </div>
  );
}
```

- [ ] **Step 3: Verificar** → build + tests verdes. **Step 4: Commit**

```bash
git add web/src/components/InboxList.tsx web/src/app/inbox/page.tsx
git commit -m "feat: UI del Inbox unificado con respuestas sugeridas (demo)"
```

---

### Task 4: Prospección

**Files:**
- Create: `web/src/app/prospeccion/page.tsx`

- [ ] **Step 1: Crear `web/src/app/prospeccion/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import { DEMO_PROSPECTS } from "@/lib/demo-data";

const ETAPA_CLS: Record<string, string> = {
  nuevo: "border-dim text-dim",
  contactado: "border-warn/60 text-warn",
  interesado: "border-accent/60 text-accent",
  cliente: "border-ok/60 text-ok",
};

export default function ProspeccionPage() {
  const total = DEMO_PROSPECTS.length;
  const nuevos = DEMO_PROSPECTS.filter((p) => p.etapa === "nuevo").length;
  const calientes = DEMO_PROSPECTS.filter((p) => p.etapa === "interesado").length;

  return (
    <div className="max-w-4xl">
      <PageHeader kicker="CRECIMIENTO" title="PROSPECCIÓN" demo />
      <p className="text-xs text-dim mb-5">
        Tu base de prospects. En la fase final, Prospector (IA) los captura del Inbox y los enriquece solo.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-3xl font-extrabold text-bright">{total}</div>
          <div className="text-[10px] tracking-widest text-dim uppercase">prospects</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-3xl font-extrabold text-bright">{nuevos}</div>
          <div className="text-[10px] tracking-widest text-dim uppercase">nuevos</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-3xl font-extrabold text-accent">{calientes}</div>
          <div className="text-[10px] tracking-widest text-dim uppercase">interesados</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-widest text-dim uppercase border-b border-border">
              <th className="text-left px-4 py-2.5 font-normal">Prospect</th>
              <th className="text-left px-4 py-2.5 font-normal hidden md:table-cell">Fuente</th>
              <th className="text-left px-4 py-2.5 font-normal hidden md:table-cell">Tags</th>
              <th className="text-left px-4 py-2.5 font-normal">Etapa</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PROSPECTS.map((p) => (
              <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-surface-2/50">
                <td className="px-4 py-2.5">
                  <div className="font-bold text-bright">{p.nombre}</div>
                  <div className="text-[10px] text-dim">{p.handle}</div>
                </td>
                <td className="px-4 py-2.5 text-muted hidden md:table-cell">{p.fuente}</td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5 mr-1">{t}</span>
                  ))}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] border rounded-full px-2 py-0.5 ${ETAPA_CLS[p.etapa]}`}>{p.etapa}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** → build + tests verdes. **Step 3: Commit**

```bash
git add web/src/app/prospeccion/page.tsx
git commit -m "feat: UI de Prospección con contadores y tabla (demo)"
```

---

### Task 5: Ventas (pipeline kanban)

**Files:**
- Create: `web/src/app/ventas/page.tsx`

- [ ] **Step 1: Crear `web/src/app/ventas/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import { DEMO_DEALS } from "@/lib/demo-data";

const COLUMNAS: { etapa: "lead" | "contactado" | "demo" | "cierre"; label: string }[] = [
  { etapa: "lead", label: "Lead" },
  { etapa: "contactado", label: "Contactado" },
  { etapa: "demo", label: "Demo" },
  { etapa: "cierre", label: "Cierre" },
];

const fmt = (n: number) => `$${(n / 1000).toFixed(0)}K`;

export default function VentasPage() {
  const totalPipeline = DEMO_DEALS.filter((d) => d.etapa !== "cierre").reduce((s, d) => s + d.valor, 0);
  const cerrado = DEMO_DEALS.filter((d) => d.etapa === "cierre").reduce((s, d) => s + d.valor, 0);

  return (
    <div className="max-w-5xl">
      <PageHeader kicker="CRECIMIENTO" title="VENTAS" demo>
        <div className="text-right">
          <div className="text-xl font-extrabold text-bright">{fmt(totalPipeline)}<span className="text-dim text-sm"> /mes en juego</span></div>
          <div className="text-[10px] text-ok tracking-widest">{fmt(cerrado)}/MES CERRADO</div>
        </div>
      </PageHeader>
      <p className="text-xs text-dim mb-5">Pipeline por marca. Conectado a Prospección: un prospect interesado se convierte en deal.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNAS.map((col) => {
          const deals = DEMO_DEALS.filter((d) => d.etapa === col.etapa);
          const suma = deals.reduce((s, d) => s + d.valor, 0);
          return (
            <div key={col.etapa} className="bg-surface/50 border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] tracking-widest text-dim uppercase">{col.label} ({deals.length})</span>
                <span className="text-[10px] text-muted">{fmt(suma)}</span>
              </div>
              <div className="space-y-2">
                {deals.map((d) => (
                  <div key={d.id} className={`bg-surface border rounded-lg p-3 ${col.etapa === "cierre" ? "border-ok/40" : "border-border hover:border-accent/40"}`}>
                    <div className="text-sm font-bold text-bright leading-tight">{d.nombre}</div>
                    <div className={`text-sm font-extrabold mt-1 ${col.etapa === "cierre" ? "text-ok" : "text-accent"}`}>{fmt(d.valor)}<span className="text-[10px] text-dim font-normal">/mes</span></div>
                    <div className="text-[10px] text-dim mt-1">{d.nota}</div>
                  </div>
                ))}
                {deals.length === 0 && <p className="text-[10px] text-dim px-1">vacío</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** → build + tests verdes. **Step 3: Commit**

```bash
git add web/src/app/ventas/page.tsx
git commit -m "feat: UI de Ventas con pipeline kanban (demo)"
```

---

### Task 6: Audit Inbox

**Files:**
- Create: `web/src/app/audits/page.tsx`

- [ ] **Step 1: Crear `web/src/app/audits/page.tsx`**

```tsx
import PageHeader from "@/components/PageHeader";
import { DEMO_AUDITS } from "@/lib/demo-data";

const PRIO_CLS: Record<string, string> = { alta: "text-red-400", media: "text-warn", baja: "text-dim" };

export default function AuditsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="INTELIGENCIA" title="AUDIT INBOX" demo />
      <p className="text-xs text-dim mb-5">
        Auditorías periódicas de tus canales. En la fase final, el Auditor (IA) las genera solo con datos reales.
      </p>

      <div className="space-y-4">
        {DEMO_AUDITS.map((a, idx) => (
          <details key={a.id} open={idx === 0} className="bg-surface border border-border rounded-xl">
            <summary className="cursor-pointer p-5 flex items-center gap-4">
              <div className="text-3xl font-extrabold text-accent w-14 text-center shrink-0">{a.score}</div>
              <div className="flex-1">
                <div className="font-bold text-bright">Auditoría de {a.canal}</div>
                <div className="text-xs text-muted">{a.resumen}</div>
              </div>
              <span className="text-[10px] text-dim shrink-0">{a.fecha}</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <p className="text-[10px] tracking-widest text-dim mb-1.5">✦ HALLAZGOS</p>
                <div className="space-y-1.5">
                  {a.hallazgos.map((h, i) => (
                    <p key={i} className="text-sm text-foreground flex gap-2">
                      <span className={`shrink-0 font-bold uppercase text-[9px] pt-1 w-12 ${PRIO_CLS[h.prioridad]}`}>{h.prioridad}</span>
                      {h.texto}
                    </p>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-[10px] tracking-widest text-accent mb-1.5">✦ ACCIONES PRIORIZADAS</p>
                <ol className="space-y-1">
                  {a.acciones.map((ac, i) => (
                    <li key={i} className="text-sm text-bright flex gap-2">
                      <span className="text-accent font-bold shrink-0">{i + 1}.</span> {ac}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** → build + tests verdes. **Step 3: Commit**

```bash
git add web/src/app/audits/page.tsx
git commit -m "feat: UI del Audit Inbox con hallazgos y acciones (demo)"
```

---

### Task 7: Ajustes (estado real de conexiones por env)

**Files:**
- Create: `web/src/app/ajustes/page.tsx`

- [ ] **Step 1: Crear `web/src/app/ajustes/page.tsx`** — única página que mira algo real: la PRESENCIA de env vars (sin llamar a nada). Server component.

```tsx
import PageHeader from "@/components/PageHeader";
import { BRANDS } from "@/lib/brands";

function Estado({ ok, okText, pendText }: { ok: boolean; okText: string; pendText: string }) {
  return ok
    ? <span className="text-[10px] border border-ok/50 text-ok rounded-full px-2 py-0.5">{okText}</span>
    : <span className="text-[10px] border border-warn/50 text-warn rounded-full px-2 py-0.5">{pendText}</span>;
}

function Fila({ nombre, nota, children }: { nombre: string; nota: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex-1">
        <div className="text-sm font-bold text-bright">{nombre}</div>
        <div className="text-xs text-dim">{nota}</div>
      </div>
      {children}
    </div>
  );
}

export default function AjustesPage() {
  const yt = Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID);
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return (
    <div className="max-w-2xl">
      <PageHeader kicker="SISTEMA" title="AJUSTES" />

      <p className="text-[10px] tracking-widest text-dim mt-4 mb-2">✦ MARCAS</p>
      <div className="bg-surface border border-border rounded-xl px-4 py-1">
        {BRANDS.map((b) => (
          <Fila key={b.id} nombre={b.name} nota={`workspace ${b.id}`}>
            <span className="w-3 h-3 rounded-full border border-border" style={{ background: b.color }} />
          </Fila>
        ))}
      </div>

      <p className="text-[10px] tracking-widest text-dim mt-6 mb-2">✦ CONEXIONES</p>
      <div className="bg-surface border border-border rounded-xl px-4 py-1">
        <Fila nombre="YouTube" nota="métricas diarias vía Data API">
          <Estado ok={yt} okText="CONECTADO" pendText="LLAVES PENDIENTES" />
        </Fila>
        <Fila nombre="Instagram" nota="requiere app de Meta Developers">
          <Estado ok={false} okText="" pendText="FASE APIS" />
        </Fila>
        <Fila nombre="Meta Ads" nota="requiere app de Meta Developers">
          <Estado ok={false} okText="" pendText="FASE APIS" />
        </Fila>
        <Fila nombre="Bot WhatsApp" nota="corre en el runner local">
          <Estado ok={false} okText="" pendText="FASE RUNNER" />
        </Fila>
      </div>

      <p className="text-[10px] tracking-widest text-dim mt-6 mb-2">✦ INTELIGENCIA</p>
      <div className="bg-surface border border-border rounded-xl px-4 py-1">
        <Fila nombre="API de Claude" nota="el cerebro del CMO Agent y el HUD">
          <Estado ok={anthropic} okText="CONECTADO" pendText="LLAVE PENDIENTE" />
        </Fila>
        <Fila nombre="Presupuesto diario de IA" nota="tope de gasto en API por día">
          <span className="text-sm font-bold text-bright">${process.env.DAILY_BUDGET_USD ?? "1.50"}</span>
        </Fila>
        <Fila nombre="Service role de Supabase" nota="necesaria para los crons">
          <Estado ok={serviceRole} okText="CONECTADO" pendText="LLAVE PENDIENTE" />
        </Fila>
      </div>

      <p className="text-[10px] tracking-widest text-dim mt-6 mb-2">✦ CUENTA</p>
      <div className="bg-surface border border-border rounded-xl px-4 py-1">
        <Fila nombre="Operador" nota={process.env.ALLOWED_EMAIL ?? "sin configurar"}>
          <span className="text-[10px] border border-accent/50 text-accent rounded-full px-2 py-0.5">PRO</span>
        </Fila>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar** → build + tests verdes. **Step 3: Commit**

```bash
git add web/src/app/ajustes/page.tsx
git commit -m "feat: página de Ajustes con estado real de conexiones"
```

---

### Task 8: Nav final + suite + deploy

**Files:**
- Modify: `web/src/lib/nav.ts`

- [ ] **Step 1: Quitar `phase` SOLO de estas líneas** (ya tienen página; el resto queda igual):

```ts
  { slug: "brief",       label: "Daily Brief",      icon: "☀", group: "centro" },
  { slug: "inbox",       label: "Inbox",            icon: "✉", group: "centro" },
  { slug: "prospeccion", label: "Prospección",      icon: "⌖", group: "crecimiento" },
  { slug: "ventas",      label: "Ventas",           icon: "↗", group: "crecimiento" },
  { slug: "audits",      label: "Audit Inbox",      icon: "✓", group: "inteligencia" },
  { slug: "ajustes",     label: "Ajustes",          icon: "⚙", group: "sistema" },
```

- [ ] **Step 2: Suite completa** → `npm test && npm run lint && npm run build` todo verde.

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/nav.ts
git commit -m "feat: nav — módulos de centro, crecimiento e inteligencia entregados"
```

(El merge a main, push y verificación de deploy los hace el controlador.)
