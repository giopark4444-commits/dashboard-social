# 🔧 Log de implementación — Fase 1

**Fecha:** 2026-06-05 · **Método:** subagent-driven development (un agente implementador por tarea + revisión de spec + revisión de calidad)
**Rama:** `fase-1` sobre repo nuevo

## Línea de tiempo de commits

| Commit | Qué | Notas |
|---|---|---|
| `4ee4fc7` (main) | Spec de diseño | Sesión de brainstorming |
| `66d3319` (main) | Bitácora de brainstorming | |
| `4a2f81b` (main) | Plan Fase 1 | 11 tareas con código completo |
| `6be482c` | Scaffold Next.js | Salió **Next.js 16.2.7** (el plan asumía 15) |
| `2496f2b` | .env.example | + excepción en .gitignore |
| `9641984` | fix: placeholders genéricos | Hallazgo de review (prefijos eyJ/AIza) |
| `5ec6902` | Tabla `snapshots` + RLS | Migración aplicada vía MCP y verificada en vivo |
| `7b52675` | Clientes Supabase + **proxy de auth** | |
| `1d59f94` | fix: bypass solo `/api/cron/` con slash | Hallazgo válido de review (hardening) |
| `e0e0988` | Página de login | |
| `38d3761` | Shell: sidebar 14 rubros + [section] | Verificado con build |
| `f14bf3d` | Adaptador YouTube + tests | TDD: fail → pass documentado |
| `3e8c6fb` | computeDeltas + runSnapshot + tests | TDD; 5 tests totales |
| `bf39b09` | Rutas API cron/refresh + vercel.json | |
| `89fafcd` | fix: revert bypass de /api/refresh | Implementador se salió del spec (ver incidencias) |
| `1b9fbb4` | Inicio panorámico | + limpieza de SVGs del boilerplate |
| `(último)` | Sidebar colapsable | Pedido de Gio post-review: 2 estados fijos, iconos centrados |

## Incidencias y cómo se resolvieron

1. **Next.js 16 ≠ datos de entrenamiento.** El scaffold incluyó `AGENTS.md` advirtiéndolo. Se verificó contra `node_modules/next/dist/docs/`:
   - `middleware.ts` → renombrado a **`proxy.ts`** con export `proxy` (convención registrada automáticamente)
   - `params` de páginas dinámicas es `Promise` (hay que `await`)
   - Regla de lint nueva `react-hooks/purity` → un `eslint-disable` justificado para `Date.now()` en `page.tsx`
2. **Falso positivo de review (rechazado con evidencia):** un revisor marcó como "crítico" que `proxy.ts` "no estaba conectado" y había que crear `middleware.ts` — incorrecto en Next 16; se demostró con docs + curl (307 a /login) y el build ("ƒ Proxy (Middleware)").
3. **Desviación de spec (revertida):** el implementador del Task 8 le quitó la protección del proxy a `/api/refresh` para que su prueba diera 401 en vez de 307. Se revirtió: defensa en profundidad (proxy + chequeo propio de la ruta).
4. **Subagentes sin acceso a MCP:** el implementador del Task 2 no pudo aplicar la migración por MCP; la aplicó el orquestador directamente y se verificó con SQL en vivo.
5. **Servidor visual de brainstorming** se apaga a los 30 min de inactividad — hubo que reiniciarlo una vez (cambia el puerto).

## Decisiones técnicas que conviene recordar

- **Verificación por diff:** como el plan especifica el código byte a byte, la revisión de spec de varios tasks se hizo con `diff` contra el plan (determinista) en vez de subagente.
- **YouTube sin OAuth en Fase 1:** stats públicas del canal con API key (`channels.list?part=statistics&id=...`). Las horas vistas (Analytics API) requieren OAuth → fase futura si se quiere.
- **`runSnapshot` sin tests unitarios a propósito** (orquestación de red); se prueba contra el sistema real vía las rutas.
- **El cron responde 207** si alguna plataforma falla (aislamiento por plataforma); con credenciales placeholder responde `{"ok":[],"failed":["youtube"]}` — comportamiento esperado hasta tener la API key.
- **Sesión de seguridad:** RLS solo-SELECT para authenticated; escrituras únicamente vía service role en server; CRON_SECRET para el cron; `.env.local` gitignoreado (verificado en todo el historial).

## Infraestructura creada en esta sesión

- **Supabase:** proyecto `dashboard-social`, ref `dhjkrrokvovlxmiuihxm`, org Gio, us-east-1, $0/mes. Tabla `snapshots` migrada (migración versionada también en `web/supabase/migrations/0001_snapshots.sql`).
- **GitHub:** repo privado `giopark4444-commits/dashboard-social` con ramas `main` (docs) y `fase-1` (código).
- **Vercel:** NADA aún — el deploy es el pendiente principal (Root Directory = `web` ⚠️).
- **`web/.env.local`:** Supabase URL + anon key reales, CRON_SECRET generado; `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY` y `YOUTUBE_CHANNEL_ID` con placeholder `PENDIENTE_GIO`.
