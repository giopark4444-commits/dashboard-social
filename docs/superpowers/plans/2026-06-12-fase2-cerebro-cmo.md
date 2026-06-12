# Fase 2 "El cerebro" — CMO Agent Implementation Plan

> ⛔ **DIFERIDO (2026-06-12):** Gio pidió dejar todo lo de APIs para el final y concentrarse primero en el diseño. Este plan queda listo para ejecutarse cuando termine la fase de diseño. No ejecutar antes.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Darle cerebro a Vantage Studio: CMO Agent con la API de Claude — Daily Brief diario por cron, chat global desde cualquier pantalla, Skills Library v1 editable y alertas, con presupuesto diario y bitácora de costos.

**Architecture:** Se agregan tablas `skills` y `briefs` al Supabase existente. Una librería `lib/anthropic.ts` (cliente + costos) + `lib/cmo.ts` (prompts puros) + `lib/cmo-run.ts` (orquestador: presupuesto → llamada → bitácora en `agent_runs`). El cron de Vercel genera el brief de cada marca cuya autonomía del CMO sea ≥ copiloto; el chat es un panel flotante global. Spec: `docs/superpowers/specs/2026-06-12-vantage-studio-design.md` §6 Fase 2.

**Tech Stack:** Next.js 16.2.7, `@anthropic-ai/sdk` (modelo `claude-opus-4-8`, adaptive thinking, SIN `temperature`), Supabase, Vitest.

**Reglas del repo:** Este Next.js difiere de los datos de entrenamiento (`web/AGENTS.md`); `cookies()`/`params` son Promise; lint `react-hooks/purity` con `Date.now()` requiere el comment disable existente. Comandos npm desde `web/`; git desde la raíz del repo. Rama de trabajo: `vantage-fase-2`.

**Claves de comportamiento (del skill claude-api, no negociables):**
- Modelo exacto: `claude-opus-4-8` ($5/M input, $25/M output).
- `thinking: { type: "adaptive" }` — nunca `budget_tokens`, nunca `temperature`/`top_p`.
- Sin prefill de turno assistant (400 en Opus 4.8).
- Parsear `response.content` filtrando `block.type === "text"`.
- Errores con clases tipadas (`Anthropic.APIError`), no string-matching.

**Realidad de llaves:** `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` aún no existen en Vercel (pendientes de Gio). Todo se construye con degradación elegante: rutas devuelven 503 con mensaje claro si falta la llave; el cron reporta `failed`. Los tests no llaman a la API real.

---

### Task 1: Migración 0003 — skills, briefs y políticas de escritura

**Files:**
- Create: `web/supabase/migrations/0003_cmo_skills_briefs.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- 0003: Fase 2 "El cerebro" — Skills Library + Daily Briefs + escritura de bitácora

-- playbooks/prompts que usan los agentes (editables desde la app)
create table public.skills (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.skills enable row level security;
create policy "authenticated_all_skills"
  on public.skills for all to authenticated
  using (true) with check (true);

insert into public.skills (title, content, tags) values
  ('Tono de marca', 'Directo, cercano y sin humo. Español latino neutro con toques colombianos cuando aplique. Frases cortas. Cero clichés de marketing ("lleva tu negocio al siguiente nivel" = prohibido).', '{voz,contenido}'),
  ('Framework de hooks', 'Un buen hook: (1) interrumpe el scroll en 1.5s, (2) promete un beneficio concreto o abre un loop de curiosidad, (3) habla del problema del espectador, no del producto. Formatos probados: pregunta incómoda, dato contraintuitivo, "esto me costó X aprenderlo", antes/después.', '{hooks,contenido}'),
  ('Criterios del Daily Brief', 'El brief es accionable o no sirve: máximo 3 acciones por día, cada una empezando con un verbo. Si no hay datos suficientes, decirlo sin inventar números. Las alertas van primero. Nada de relleno motivacional.', '{cmo,brief}');

-- parte diario generado por el CMO Agent, uno por marca por día
create table public.briefs (
  id bigint generated always as identity primary key,
  brand_id text not null references public.brands(id),
  brief_date date not null,
  content text not null,                       -- markdown
  alerts jsonb not null default '[]'::jsonb,
  cost_usd numeric(8,4),
  created_at timestamptz not null default now(),
  unique (brand_id, brief_date)
);
alter table public.briefs enable row level security;
create policy "authenticated_all_briefs"
  on public.briefs for all to authenticated
  using (true) with check (true);

-- la app (usuario autenticado) registra runs de agentes: chat y briefs manuales
create policy "authenticated_insert_agent_runs"
  on public.agent_runs for insert to authenticated
  with check (true);
```

- [ ] **Step 2: Aplicar la migración**

Vía MCP: `mcp__plugin_supabase_supabase__apply_migration` con `project_id: dhjkrrokvovlxmiuihxm`, `name: cmo_skills_briefs`, query = el SQL de arriba. (El controlador la aplica; el implementador solo crea el archivo y commitea.)

- [ ] **Step 3: Verificar**

`mcp__plugin_supabase_supabase__list_tables`: aparecen `skills` (3 filas) y `briefs`.

- [ ] **Step 4: Commit**

```bash
git add web/supabase/migrations/0003_cmo_skills_briefs.sql
git commit -m "feat: migración skills, briefs y escritura de bitácora (Fase 2)"
```

---

### Task 2: SDK de Anthropic + cliente y costos

**Files:**
- Modify: `web/package.json` (vía npm install)
- Modify: `web/.env.example`
- Create: `web/src/lib/anthropic.ts`
- Test: `web/src/lib/__tests__/anthropic.test.ts`

- [ ] **Step 1: Instalar el SDK**

Run (en `web/`): `npm install @anthropic-ai/sdk`
Expected: aparece en dependencies de package.json.

- [ ] **Step 2: Agregar a `.env.example`** (al final):

```
ANTHROPIC_API_KEY=tu_api_key_de_anthropic
DAILY_BUDGET_USD=1.50
```

- [ ] **Step 3: Test que falla** — `web/src/lib/__tests__/anthropic.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeCostUsd, CMO_MODEL } from "@/lib/anthropic";

describe("anthropic", () => {
  it("usa el modelo correcto", () => {
    expect(CMO_MODEL).toBe("claude-opus-4-8");
  });

  it("computeCostUsd: input y output a precios de opus 4.8", () => {
    // 1M input ($5) + 1M output ($25) = $30
    expect(computeCostUsd({ input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBeCloseTo(30);
  });

  it("computeCostUsd: caché a 1.25x escritura y 0.1x lectura", () => {
    const cost = computeCostUsd({
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 1_000_000, // 5 * 1.25 = 6.25
      cache_read_input_tokens: 1_000_000,     // 5 * 0.1  = 0.50
    });
    expect(cost).toBeCloseTo(6.75);
  });

  it("computeCostUsd: tolera campos ausentes", () => {
    expect(computeCostUsd({ input_tokens: 1000, output_tokens: 500 })).toBeCloseTo(0.0175);
  });
});
```

- [ ] **Step 4: Correr y ver que falla**

Run: `npm test` → FAIL (módulo no existe).

- [ ] **Step 5: Implementar `web/src/lib/anthropic.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";

export const CMO_MODEL = "claude-opus-4-8";

// Precios de claude-opus-4-8 (USD por millón de tokens)
const INPUT_PER_MTOK = 5;
const OUTPUT_PER_MTOK = 25;
const CACHE_WRITE_MULT = 1.25;
const CACHE_READ_MULT = 0.1;

export type UsageLike = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

/** Costo en USD de una respuesta según su usage. */
export function computeCostUsd(usage: UsageLike): number {
  return (
    (usage.input_tokens * INPUT_PER_MTOK +
      usage.output_tokens * OUTPUT_PER_MTOK +
      (usage.cache_creation_input_tokens ?? 0) * INPUT_PER_MTOK * CACHE_WRITE_MULT +
      (usage.cache_read_input_tokens ?? 0) * INPUT_PER_MTOK * CACHE_READ_MULT) /
    1_000_000
  );
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Cliente del API (lee ANTHROPIC_API_KEY del entorno). Solo server. */
export function createAnthropic(): Anthropic {
  return new Anthropic();
}

export function dailyBudgetUsd(): number {
  const n = Number(process.env.DAILY_BUDGET_USD);
  return Number.isFinite(n) && n > 0 ? n : 1.5;
}
```

- [ ] **Step 6: Correr tests** → PASS.

- [ ] **Step 7: Commit**

```bash
git add web/package.json web/package-lock.json web/.env.example web/src/lib/anthropic.ts web/src/lib/__tests__/anthropic.test.ts
git commit -m "feat: SDK de Anthropic, modelo CMO y cálculo de costos"
```

---

### Task 3: Alertas inteligentes (lib/alerts.ts)

**Files:**
- Create: `web/src/lib/alerts.ts`
- Test: `web/src/lib/__tests__/alerts.test.ts`

- [ ] **Step 1: Test que falla** — `web/src/lib/__tests__/alerts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeAlerts, type PlatformMetrics } from "@/lib/alerts";

function m(platform: string, current: number | null, vsYesterday: number | null, vsWeek: number | null): PlatformMetrics {
  return { platform, deltas: { current, vsYesterday, vsWeek, spark: [] } };
}

describe("computeAlerts", () => {
  it("sin datos ⇒ alerta info por plataforma", () => {
    const alerts = computeAlerts([m("youtube", null, null, null)]);
    expect(alerts).toEqual([
      { severity: "info", platform: "youtube", message: "Sin datos de youtube — canal no conectado o snapshot fallando." },
    ]);
  });

  it("caída vs ayer ⇒ warn", () => {
    const alerts = computeAlerts([m("youtube", 3200, -15, 50)]);
    expect(alerts).toContainEqual({
      severity: "warn", platform: "youtube", message: "youtube perdió 15 seguidores vs ayer.",
    });
  });

  it("crecimiento semanal ≥10% ⇒ info de oportunidad", () => {
    // current 1100, vsWeek 100 ⇒ base 1000 ⇒ +10%
    const alerts = computeAlerts([m("youtube", 1100, 5, 100)]);
    expect(alerts).toContainEqual({
      severity: "info", platform: "youtube", message: "youtube creció 10.0% esta semana — momentum para publicar más.",
    });
  });

  it("todo estable ⇒ sin alertas", () => {
    expect(computeAlerts([m("youtube", 1000, 2, 10)])).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr y ver que falla** → FAIL.

- [ ] **Step 3: Implementar `web/src/lib/alerts.ts`**

```ts
import type { Deltas } from "@/lib/snapshots";

export type PlatformMetrics = { platform: string; deltas: Deltas };
export type Alert = { severity: "info" | "warn" | "critical"; platform: string; message: string };

const WEEKLY_SURGE = 0.10; // +10% semanal = momentum

/** Alertas a partir de las métricas por plataforma. Puro y testeable. */
export function computeAlerts(metrics: PlatformMetrics[]): Alert[] {
  const alerts: Alert[] = [];
  for (const { platform, deltas } of metrics) {
    if (deltas.current === null) {
      alerts.push({
        severity: "info", platform,
        message: `Sin datos de ${platform} — canal no conectado o snapshot fallando.`,
      });
      continue;
    }
    if (deltas.vsYesterday !== null && deltas.vsYesterday < 0) {
      alerts.push({
        severity: "warn", platform,
        message: `${platform} perdió ${Math.abs(deltas.vsYesterday)} seguidores vs ayer.`,
      });
    }
    if (deltas.vsWeek !== null && deltas.vsWeek > 0) {
      const base = deltas.current - deltas.vsWeek;
      if (base > 0 && deltas.vsWeek / base >= WEEKLY_SURGE) {
        const pct = ((deltas.vsWeek / base) * 100).toFixed(1);
        alerts.push({
          severity: "info", platform,
          message: `${platform} creció ${pct}% esta semana — momentum para publicar más.`,
        });
      }
    }
  }
  return alerts;
}
```

- [ ] **Step 4: Correr tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/alerts.ts web/src/lib/__tests__/alerts.test.ts
git commit -m "feat: alertas inteligentes a partir de métricas"
```

---

### Task 4: Prompts del CMO (lib/cmo.ts)

**Files:**
- Create: `web/src/lib/cmo.ts`
- Test: `web/src/lib/__tests__/cmo.test.ts`

- [ ] **Step 1: Test que falla** — `web/src/lib/__tests__/cmo.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildCmoSystemPrompt, buildBriefUserPrompt } from "@/lib/cmo";

const brand = { id: "vendalo", name: "Vendalo", color: "#25d366" };
const skills = [{ title: "Tono de marca", content: "Directo y sin humo." }];

describe("buildCmoSystemPrompt", () => {
  it("incluye marca, rol y skills", () => {
    const p = buildCmoSystemPrompt(brand, skills);
    expect(p).toContain("Vendalo");
    expect(p).toContain("CMO");
    expect(p).toContain("Tono de marca");
    expect(p).toContain("Directo y sin humo.");
  });

  it("recorta skills muy largas a 4000 caracteres", () => {
    const long = [{ title: "X", content: "a".repeat(10_000) }];
    const p = buildCmoSystemPrompt(brand, long);
    expect(p.length).toBeLessThan(10_000);
  });
});

describe("buildBriefUserPrompt", () => {
  it("incluye fecha, métricas y alertas", () => {
    const p = buildBriefUserPrompt({
      dateIso: "2026-06-12",
      metrics: [{ platform: "youtube", deltas: { current: 3200, vsYesterday: 5, vsWeek: 40, spark: [] } }],
      alerts: [{ severity: "warn", platform: "youtube", message: "perdió seguidores" }],
    });
    expect(p).toContain("2026-06-12");
    expect(p).toContain("youtube");
    expect(p).toContain("3200");
    expect(p).toContain("perdió seguidores");
  });

  it("sin métricas: lo dice explícitamente", () => {
    const p = buildBriefUserPrompt({ dateIso: "2026-06-12", metrics: [], alerts: [] });
    expect(p).toContain("No hay métricas");
  });
});
```

- [ ] **Step 2: Correr y ver que falla** → FAIL.

- [ ] **Step 3: Implementar `web/src/lib/cmo.ts`**

```ts
import type { Brand } from "@/lib/brands";
import type { Deltas } from "@/lib/snapshots";
import type { Alert } from "@/lib/alerts";

export type SkillSnippet = { title: string; content: string };
const SKILL_MAX_CHARS = 4000;

/** System prompt del CMO Agent para una marca, con las skills inyectadas. */
export function buildCmoSystemPrompt(brand: Brand, skills: SkillSnippet[]): string {
  const skillBlocks = skills
    .map((s) => `### ${s.title}\n${s.content.slice(0, SKILL_MAX_CHARS)}`)
    .join("\n\n");
  return `Eres el CMO (director de marketing) de la marca "${brand.name}" dentro de Vantage Studio, el command center de marketing de Gio.

Tu trabajo: analizar métricas, detectar oportunidades y dar recomendaciones ACCIONABLES. Respondes en español, directo y sin relleno. Cuando no tengas datos, lo dices sin inventar números.

Playbooks de la Skills Library (síguelos siempre):

${skillBlocks || "(sin playbooks aún)"}`;
}

export type BriefInput = {
  dateIso: string;
  metrics: { platform: string; deltas: Deltas }[];
  alerts: Alert[];
};

/** Prompt de usuario para generar el Daily Brief. */
export function buildBriefUserPrompt(input: BriefInput): string {
  const metricsText = input.metrics.length
    ? input.metrics
        .map(({ platform, deltas }) =>
          `- ${platform}: ${deltas.current ?? "sin datos"} seguidores` +
          (deltas.vsYesterday !== null ? ` (${deltas.vsYesterday >= 0 ? "+" : ""}${deltas.vsYesterday} vs ayer)` : "") +
          (deltas.vsWeek !== null ? ` (${deltas.vsWeek >= 0 ? "+" : ""}${deltas.vsWeek} en 7 días)` : "")
        )
        .join("\n")
    : "No hay métricas disponibles todavía (canales sin conectar).";

  const alertsText = input.alerts.length
    ? input.alerts.map((a) => `- [${a.severity}] ${a.message}`).join("\n")
    : "Sin alertas.";

  return `Genera el Daily Brief de hoy ${input.dateIso}.

Métricas actuales:
${metricsText}

Alertas detectadas:
${alertsText}

Formato (markdown, conciso):
## Resumen
(2 frases máximo)
## Alertas
(las importantes; si no hay, "Sin novedades")
## Qué hacer hoy
(máximo 3 acciones, cada una empieza con un verbo)
## Oportunidad
(1 idea concreta de contenido o crecimiento para esta marca)`;
}
```

- [ ] **Step 4: Correr tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/cmo.ts web/src/lib/__tests__/cmo.test.ts
git commit -m "feat: prompts del CMO Agent (system + daily brief)"
```

---

### Task 5: Orquestador runCmo (presupuesto → llamada → bitácora)

**Files:**
- Create: `web/src/lib/cmo-run.ts`

(Sin unit test propio: es integración pura con API+DB; las piezas puras ya están testeadas. La verificación es el build + prueba manual de Task 9.)

- [ ] **Step 1: Implementar `web/src/lib/cmo-run.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CMO_MODEL, computeCostUsd, createAnthropic, dailyBudgetUsd, hasAnthropicKey } from "@/lib/anthropic";

export class CmoError extends Error {
  constructor(public code: "no_key" | "budget_exceeded" | "api_error", message: string) {
    super(message);
  }
}

/** Gasto de hoy (UTC) según la bitácora. */
export async function getSpentTodayUsd(supabase: SupabaseClient): Promise<number> {
  const todayStart = new Date().toISOString().slice(0, 10) + "T00:00:00Z";
  const { data } = await supabase
    .from("agent_runs")
    .select("cost_usd")
    .gte("created_at", todayStart);
  return (data ?? []).reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0);
}

export type CmoCallResult = { text: string; costUsd: number };

/**
 * Una llamada del CMO Agent: chequea llave y presupuesto, llama a Claude,
 * registra el run (ok o error) en agent_runs y devuelve el texto.
 */
export async function runCmo(opts: {
  supabase: SupabaseClient;
  brandId: string;
  action: string; // p.ej. "chat" | "daily-brief"
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}): Promise<CmoCallResult> {
  if (!hasAnthropicKey())
    throw new CmoError("no_key", "Falta ANTHROPIC_API_KEY — el cerebro está desconectado.");

  const budget = dailyBudgetUsd();
  const spent = await getSpentTodayUsd(opts.supabase);
  if (spent >= budget)
    throw new CmoError("budget_exceeded", `Presupuesto diario de API agotado ($${spent.toFixed(2)} de $${budget.toFixed(2)}).`);

  const client = createAnthropic();
  try {
    const response = await client.messages.create({
      model: CMO_MODEL,
      max_tokens: opts.maxTokens ?? 4096,
      thinking: { type: "adaptive" },
      system: opts.system,
      messages: opts.messages,
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const costUsd = computeCostUsd(response.usage);
    await opts.supabase.from("agent_runs").insert({
      agent_id: "cmo", brand_id: opts.brandId, action: opts.action,
      status: "ok", cost_usd: costUsd, detail: { model: CMO_MODEL, usage: response.usage },
    });
    return { text, costUsd };
  } catch (err) {
    const message = err instanceof Anthropic.APIError ? `${err.status}: ${err.message}` : String(err);
    await opts.supabase.from("agent_runs").insert({
      agent_id: "cmo", brand_id: opts.brandId, action: opts.action,
      status: "error", detail: { error: message },
    });
    throw new CmoError("api_error", message);
  }
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run build` → verde (la función aún no se usa, pero el type-check corre).

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/cmo-run.ts
git commit -m "feat: orquestador del CMO — presupuesto, llamada y bitácora"
```

---

### Task 6: Cron del Daily Brief

**Files:**
- Create: `web/src/app/api/cron/brief/route.ts`
- Modify: `vercel.json` y `web/vercel.json` (agregar el cron)

- [ ] **Step 1: Crear `web/src/app/api/cron/brief/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRANDS, getBrand } from "@/lib/brands";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import { computeAlerts } from "@/lib/alerts";
import { buildBriefUserPrompt, buildCmoSystemPrompt } from "@/lib/cmo";
import { runCmo } from "@/lib/cmo-run";

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const ok: string[] = [];
  const failed: string[] = [];

  const { data: settings } = await supabase
    .from("agent_settings").select("brand_id,autonomy").eq("agent_id", "cmo");
  const { data: skills } = await supabase.from("skills").select("title,content");

  for (const brand of BRANDS) {
    // El brief solo corre solo si el CMO tiene autonomía ≥ copiloto para la marca
    const autonomy = settings?.find((s) => s.brand_id === brand.id)?.autonomy ?? "manual";
    if (autonomy === "manual") continue;

    try {
      const { data: snaps } = await supabase
        .from("snapshots")
        .select("platform,snapshot_date,followers,total_views,posts_count")
        .eq("brand_id", brand.id).gte("snapshot_date", since);
      const rows = (snaps ?? []) as SnapshotRow[];
      const platforms = [...new Set(rows.map((r) => r.platform))];
      const metrics = platforms.map((p) => ({
        platform: p,
        deltas: computeDeltas(rows.filter((r) => r.platform === p)),
      }));
      const alerts = computeAlerts(metrics);

      const { text, costUsd } = await runCmo({
        supabase, brandId: brand.id, action: "daily-brief",
        system: buildCmoSystemPrompt(getBrand(brand.id), skills ?? []),
        messages: [{ role: "user", content: buildBriefUserPrompt({ dateIso: today, metrics, alerts }) }],
      });

      const { error } = await supabase.from("briefs").upsert(
        { brand_id: brand.id, brief_date: today, content: text, alerts, cost_usd: costUsd },
        { onConflict: "brand_id,brief_date" }
      );
      if (error) throw new Error(error.message);
      ok.push(brand.id);
    } catch {
      failed.push(brand.id);
    }
  }
  return NextResponse.json({ ok, failed }, { status: failed.length ? 207 : 200 });
}
```

- [ ] **Step 2: Agregar el cron a AMBOS `vercel.json`** (raíz y `web/`), contenido idéntico:

```json
{
  "crons": [
    { "path": "/api/cron/snapshot", "schedule": "0 11 * * *" },
    { "path": "/api/cron/brief", "schedule": "30 11 * * *" }
  ]
}
```

(11:30 UTC = 6:30am Bogotá, media hora después del snapshot.)

- [ ] **Step 3: Verificar build** → `npm run build` verde.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/api/cron/brief/route.ts vercel.json web/vercel.json
git commit -m "feat: cron del Daily Brief (respeta autonomía del CMO por marca)"
```

---

### Task 7: Página Daily Brief + generación manual

**Files:**
- Create: `web/src/app/api/brief/generate/route.ts`
- Create: `web/src/components/GenerateBriefButton.tsx`
- Create: `web/src/app/brief/page.tsx` (ruta estática — gana sobre `[section]`)

- [ ] **Step 1: Crear `web/src/app/api/brief/generate/route.ts`** (generación manual: siempre permitida, es acción del usuario)

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import { computeAlerts } from "@/lib/alerts";
import { buildBriefUserPrompt, buildCmoSystemPrompt } from "@/lib/cmo";
import { CmoError, runCmo } from "@/lib/cmo-run";

export const maxDuration = 120;

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  const brand = await getActiveBrand();
  const today = new Date().toISOString().slice(0, 10);
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const [{ data: snaps }, { data: skills }] = await Promise.all([
    supabase.from("snapshots")
      .select("platform,snapshot_date,followers,total_views,posts_count")
      .eq("brand_id", brand.id).gte("snapshot_date", since),
    supabase.from("skills").select("title,content"),
  ]);
  const rows = (snaps ?? []) as SnapshotRow[];
  const platforms = [...new Set(rows.map((r) => r.platform))];
  const metrics = platforms.map((p) => ({
    platform: p,
    deltas: computeDeltas(rows.filter((r) => r.platform === p)),
  }));
  const alerts = computeAlerts(metrics);

  try {
    const { text, costUsd } = await runCmo({
      supabase, brandId: brand.id, action: "daily-brief",
      system: buildCmoSystemPrompt(brand, skills ?? []),
      messages: [{ role: "user", content: buildBriefUserPrompt({ dateIso: today, metrics, alerts }) }],
    });
    const { error } = await supabase.from("briefs").upsert(
      { brand_id: brand.id, brief_date: today, content: text, alerts, cost_usd: costUsd },
      { onConflict: "brand_id,brief_date" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CmoError)
      return NextResponse.json({ error: err.message }, { status: err.code === "no_key" ? 503 : 429 });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Crear `web/src/components/GenerateBriefButton.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateBriefButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/brief/generate", { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Error generando el brief" }));
      setError(body.error);
    } else {
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="text-right">
      <button onClick={generate} disabled={busy}
        className="text-sm bg-accent/20 border border-accent/50 text-bright rounded-lg px-4 py-1.5 hover:bg-accent/30 disabled:opacity-50">
        {busy ? "El CMO está pensando…" : "◉ Generar brief ahora"}
      </button>
      {error && <p className="text-xs text-warn mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Crear `web/src/app/brief/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import type { Alert } from "@/lib/alerts";
import GenerateBriefButton from "@/components/GenerateBriefButton";

export const dynamic = "force-dynamic";

type BriefRow = {
  id: number; brief_date: string; content: string;
  alerts: Alert[]; cost_usd: number | null;
};

export default async function BriefPage() {
  const supabase = await createClient();
  const brand = await getActiveBrand();
  const { data } = await supabase
    .from("briefs")
    .select("id,brief_date,content,alerts,cost_usd")
    .eq("brand_id", brand.id)
    .order("brief_date", { ascending: false })
    .limit(15);
  const briefs = (data ?? []) as BriefRow[];
  const [latest, ...history] = briefs;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-accent">✦ CENTRO · {brand.name.toUpperCase()}</p>
          <h1 className="text-2xl font-extrabold text-bright tracking-wider">DAILY BRIEF</h1>
        </div>
        <GenerateBriefButton />
      </div>

      {!latest ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-sm text-muted">
          Aún no hay briefs para esta marca. Genera el primero con el botón, o pon al
          CMO Agent en modo Copiloto (panel de Agentes) para recibirlo cada mañana a las 6:30.
        </div>
      ) : (
        <article className="bg-surface border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dim tracking-widest">{latest.brief_date}</span>
            {latest.cost_usd != null && (
              <span className="text-[10px] text-dim">costo API ${Number(latest.cost_usd).toFixed(3)}</span>
            )}
          </div>
          {latest.alerts.length > 0 && (
            <div className="mb-4 space-y-1">
              {latest.alerts.map((a, i) => (
                <div key={i} className={`text-xs ${a.severity === "warn" ? "text-warn" : a.severity === "critical" ? "text-red-400" : "text-muted"}`}>
                  ● {a.message}
                </div>
              ))}
            </div>
          )}
          <pre className="whitespace-pre-wrap font-[inherit] text-sm text-foreground leading-relaxed">{latest.content}</pre>
        </article>
      )}

      {history.length > 0 && (
        <>
          <p className="text-[10px] tracking-widest text-dim mb-2">✦ ANTERIORES</p>
          <div className="space-y-2">
            {history.map((b) => (
              <details key={b.id} className="bg-surface border border-border rounded-xl p-4">
                <summary className="text-sm text-bright cursor-pointer">{b.brief_date}</summary>
                <pre className="whitespace-pre-wrap font-[inherit] text-sm text-muted mt-3">{b.content}</pre>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verificar** → `npm run build && npm test` verdes.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/api/brief web/src/app/brief web/src/components/GenerateBriefButton.tsx
git commit -m "feat: página Daily Brief con generación manual e historial"
```

---

### Task 8: Skills Library (página + API)

**Files:**
- Create: `web/src/app/api/skills/route.ts`
- Create: `web/src/components/SkillEditor.tsx`
- Create: `web/src/app/skills/page.tsx` (ruta estática — gana sobre `[section]`)

- [ ] **Step 1: Crear `web/src/app/api/skills/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function authedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function POST(req: Request) {
  const supabase = await authedClient();
  if (!supabase) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const body = (await req.json()) as { id?: number; title?: string; content?: string; tags?: string[] };
  if (!body.title?.trim() || !body.content?.trim())
    return NextResponse.json({ error: "title y content son obligatorios" }, { status: 400 });

  const row = {
    title: body.title.trim(),
    content: body.content,
    tags: body.tags ?? [],
    updated_at: new Date().toISOString(),
  };
  const query = body.id
    ? supabase.from("skills").update(row).eq("id", body.id)
    : supabase.from("skills").insert(row);
  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await authedClient();
  if (!supabase) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const { id } = (await req.json()) as { id?: number };
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  const { error } = await supabase.from("skills").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Crear `web/src/components/SkillEditor.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type SkillRow = { id: number; title: string; content: string; tags: string[] };

export default function SkillEditor({ skill }: { skill?: SkillRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(skill?.title ?? "");
  const [content, setContent] = useState(skill?.content ?? "");
  const [tags, setTags] = useState(skill?.tags.join(", ") ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: skill?.id, title, content,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setBusy(false);
    setOpen(false);
    if (!skill) { setTitle(""); setContent(""); setTags(""); }
    router.refresh();
  }

  async function remove() {
    if (!skill) return;
    setBusy(true);
    await fetch("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: skill.id }),
    });
    setBusy(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className={skill
          ? "text-xs text-dim hover:text-accent"
          : "text-sm bg-accent/20 border border-accent/50 text-bright rounded-lg px-4 py-1.5 hover:bg-accent/30"}>
        {skill ? "editar" : "✦ Nueva skill"}
      </button>
    );
  }

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-2 mt-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título"
        className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-bright placeholder:text-dim" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
        placeholder="El playbook que el CMO debe seguir…"
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-dim" />
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags separados por coma"
        className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-muted placeholder:text-dim" />
      <div className="flex gap-2 justify-end">
        {skill && (
          <button onClick={remove} disabled={busy} className="text-xs text-red-400 hover:underline mr-auto">
            eliminar
          </button>
        )}
        <button onClick={() => setOpen(false)} className="text-xs text-dim px-3 py-1.5">cancelar</button>
        <button onClick={save} disabled={busy || !title.trim() || !content.trim()}
          className="text-xs bg-accent/20 border border-accent/50 text-bright rounded-lg px-4 py-1.5 disabled:opacity-50">
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `web/src/app/skills/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import SkillEditor, { type SkillRow } from "@/components/SkillEditor";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skills").select("id,title,content,tags").order("updated_at", { ascending: false });
  const skills = (data ?? []) as SkillRow[];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-accent">✦ INTELIGENCIA</p>
          <h1 className="text-2xl font-extrabold text-bright tracking-wider">SKILLS LIBRARY</h1>
        </div>
        <SkillEditor />
      </div>
      <p className="text-xs text-dim mb-6">
        Los playbooks que el CMO Agent sigue en cada brief y cada chat. Tu conocimiento de marketing, versionado.
      </p>

      <div className="space-y-3">
        {skills.map((s) => (
          <div key={s.id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-bright flex-1">{s.title}</h2>
              {s.tags.map((t) => (
                <span key={t} className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5">{t}</span>
              ))}
              <SkillEditor skill={s} />
            </div>
            <p className="text-sm text-muted mt-2 whitespace-pre-wrap">{s.content}</p>
          </div>
        ))}
        {skills.length === 0 && (
          <p className="text-sm text-dim">Sin skills aún — crea la primera.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar** → `npm run build && npm test` verdes.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/api/skills web/src/app/skills web/src/components/SkillEditor.tsx
git commit -m "feat: Skills Library editable (playbooks del CMO)"
```

---

### Task 9: Chat global del CMO

**Files:**
- Create: `web/src/app/api/cmo/chat/route.ts`
- Create: `web/src/components/CmoChat.tsx`
- Modify: `web/src/app/layout.tsx` (montar el chat)
- Modify: `web/src/lib/nav.ts` (quitar `phase` de brief y skills; youtube y ajustes pasan a `phase: 3`)

- [ ] **Step 1: Crear `web/src/app/api/cmo/chat/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBrand, resolveBrandId } from "@/lib/brands";
import { buildCmoSystemPrompt } from "@/lib/cmo";
import { CmoError, runCmo } from "@/lib/cmo-run";

export const maxDuration = 120;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  const body = (await req.json()) as { brandId?: string; messages?: ChatMessage[] };
  const messages = (body.messages ?? []).slice(-12); // las últimas 12 vueltas
  if (messages.length === 0 || messages[messages.length - 1].role !== "user")
    return NextResponse.json({ error: "mensajes inválidos" }, { status: 400 });

  const brand = getBrand(resolveBrandId(body.brandId));
  const { data: skills } = await supabase.from("skills").select("title,content");

  try {
    const { text, costUsd } = await runCmo({
      supabase, brandId: brand.id, action: "chat",
      system: buildCmoSystemPrompt(brand, skills ?? []),
      messages,
    });
    return NextResponse.json({ text, costUsd });
  } catch (err) {
    if (err instanceof CmoError)
      return NextResponse.json({ error: err.message }, { status: err.code === "no_key" ? 503 : 429 });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Crear `web/src/components/CmoChat.tsx`**

```tsx
"use client";
import { useRef, useState } from "react";
import type { Brand } from "@/lib/brands";

type Msg = { role: "user" | "assistant"; content: string };

export default function CmoChat({ brand }: { brand: Brand }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function send() {
    const content = input.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    const res = await fetch("/api/cmo/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: brand.id, messages: next }),
    });
    const data = await res.json().catch(() => ({ error: "Error de red" }));
    setMessages([...next, {
      role: "assistant",
      content: res.ok ? data.text : `⚠ ${data.error}`,
    }]);
    setBusy(false);
    setTimeout(() => listRef.current?.scrollTo({ top: 99999 }), 50);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} title="Hablar con el CMO Agent"
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-surface-2 border border-accent/50 text-accent text-xl hover:border-accent shadow-lg">
        ◉
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-96 max-w-[calc(100vw-2.5rem)] bg-surface border border-border rounded-xl shadow-2xl flex flex-col" style={{ height: "28rem" }}>
      <div className="flex items-center px-4 py-2 border-b border-border">
        <span className="text-accent mr-2">◉</span>
        <div className="flex-1">
          <div className="text-xs font-bold text-bright tracking-widest">CMO AGENT</div>
          <div className="text-[9px] text-dim tracking-widest">{brand.name.toUpperCase()}</div>
        </div>
        <button onClick={() => setOpen(false)} className="text-dim hover:text-muted">✕</button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.length === 0 && (
          <p className="text-xs text-dim p-2">
            Pregúntame qué hacer hoy, pídeme ideas de contenido o un análisis de tus métricas de {brand.name}.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user"
            ? "bg-surface-2 border border-border rounded-lg px-3 py-2 ml-8 text-bright"
            : "px-3 py-1 text-foreground whitespace-pre-wrap"}>
            {m.content}
          </div>
        ))}
        {busy && <p className="text-xs text-dim px-3 animate-pulse">El CMO está pensando…</p>}
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escríbele al CMO…"
          className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-dim" />
        <button onClick={send} disabled={busy || !input.trim()}
          className="text-sm bg-accent/20 border border-accent/50 text-bright rounded-lg px-3 disabled:opacity-50">
          ➤
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Montar en `layout.tsx`** — agregar el import y el componente dentro del `<body>`, después del `<div className="flex">`:

```tsx
import CmoChat from "@/components/CmoChat";
// ...
      <body className="bg-background text-foreground">
        <div className="flex">
          <Sidebar updatedAt={updatedAt} brand={brand} />
          <main className="flex-1 p-6">{children}</main>
        </div>
        <CmoChat brand={brand} />
      </body>
```

- [ ] **Step 4: Actualizar `nav.ts`** — los módulos entregados dejan de ser placeholders y los corridos se reetiquetan. Cambiar SOLO estas líneas:

```ts
  { slug: "brief",       label: "Daily Brief",      icon: "☀", group: "centro" },
  { slug: "youtube",     label: "YouTube",          icon: "▶", group: "canales",      phase: 3 },
  { slug: "skills",      label: "Skills Library",   icon: "✦", group: "inteligencia" },
  { slug: "ajustes",     label: "Ajustes",          icon: "⚙", group: "sistema",      phase: 3 },
```

(brief y skills ya tienen página real; el módulo YouTube y Ajustes se mueven a la Fase 3 porque dependen de las llaves pendientes / son menores.)

- [ ] **Step 5: Verificar** → `npm run build && npm test` verdes (los tests de nav no asumen phases concretas).

- [ ] **Step 6: Commit**

```bash
git add web/src/app/api/cmo web/src/components/CmoChat.tsx web/src/app/layout.tsx web/src/lib/nav.ts
git commit -m "feat: chat global con el CMO Agent + nav actualizado"
```

---

### Task 10: Verificación final y deploy

- [ ] **Step 1: Suite completa**

Run (en `web/`): `npm test && npm run lint && npm run build`
Expected: todo verde.

- [ ] **Step 2: Prueba manual en dev** (sin ANTHROPIC_API_KEY local, esto valida la degradación)

Run: `npm run dev` → abrir `/brief`: el botón "Generar brief ahora" debe devolver el error claro de llave faltante (503), no un crash. `/skills` debe listar las 3 skills sembradas. El botón flotante ◉ debe abrir el chat y mostrar el mismo error elegante al enviar.

- [ ] **Step 3: Merge y push**

```bash
git checkout main && git merge --no-ff vantage-fase-2 -m "Fase 2 El cerebro: CMO Agent (brief + chat + skills + presupuesto)"
git push origin main
```

- [ ] **Step 4: Verificar producción**

Poll a `https://dashboard-social-eight.vercel.app/login` hasta ver el deploy nuevo; verificar `/brief` y `/skills` cargan (tras login… si Gio ya creó su usuario; si no, verificar que devuelven redirect a /login con 307/200).

- [ ] **Step 5: Recordar pendientes a Gio**

`ANTHROPIC_API_KEY` y `DAILY_BUDGET_USD` en Vercel (y `SUPABASE_SERVICE_ROLE_KEY` heredada) + crear su usuario auth. Sin la llave, el cerebro queda construido pero dormido.
