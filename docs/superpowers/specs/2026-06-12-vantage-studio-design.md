# Vantage Studio — Diseño

**Fecha:** 2026-06-12
**Estado:** Aprobado en sesión de brainstorming con Gio
**Origen:** Evolución del proyecto Dashboard Social (este mismo repo) hacia un command center de marketing con agentes IA, inspirado en la app "Vantage Studio" vista en un Reel, con mejoras propias.

## 1. Visión

Una sola app web que actúa como **centro de mando de marketing multi-marca** para Gio: métricas de todos los canales, fábrica de contenido, prospección/ventas y una capa de **agentes IA con autonomía graduable** comandada por un "CMO Agent", con un HUD estilo Jarvis (orbe 3D + chat + voz) como interfaz estrella.

**Marcas que maneja (workspaces):** Marca Personal, Vendalo, Oriole 1060 (SaaS), 1060 Bar (negocio físico) y Clientes/terceros. Multi-marca desde el día 1.

## 2. Decisiones tomadas

| Decisión | Elección |
|---|---|
| Relación con Dashboard Social | **Evolucionar este repo** — se renombra y rediseña; YouTube, cron, Supabase y Vercel se heredan |
| Alcance de marcas | Multi-marca (5 workspaces) desde el día 1 |
| Autonomía de la IA | **Agentes autónomos con reglas**, llegando por niveles: Manual → Copiloto → Auto, configurable por agente y por marca |
| APIs de Meta (Instagram, Meta Ads) | **Diseñar ya, conectar después** — módulos nacen en modo demo/manual, listos para enchufar la API cuando Gio haga los trámites |
| Bot WhatsApp | **Módulo propio independiente de Vendalo** (corre en el runner local), reusando el código anti-baneo de Vendalo como librería |
| Jarvis HUD | **Orbe 3D + chat + voz completa** (texto primero, voz al final de su fase) |
| Arquitectura | **B: Vercel + Runner local** (patrón Vendalo) |
| Navegación | **Agrupada + selector de marca** (5 categorías: Centro, Canales, Crecimiento, Contenido, Inteligencia) |

## 3. Arquitectura

Tres piezas que se comunican a través de Supabase (cola de trabajos + realtime):

1. **Vercel — la app** (Next.js, evolución del código actual)
   - UI de todos los módulos + selector de marca
   - API routes y crons cortos (snapshots de métricas, disparo del Daily Brief)
   - Jarvis HUD: orbe 3D (Three.js), chat, voz vía micrófono del navegador
2. **Supabase — memoria central** (proyecto existente `dhjkrrokvovlxmiuihxm`)
   - Postgres + RLS: marcas, métricas, contenido, prospects, reglas, bitácoras
   - Realtime: dashboard y HUD se actualizan en vivo
   - Storage: assets de carruseles/videos
   - Tabla `jobs` como cola de trabajos para el runner
3. **Runner local (Mac de Gio) — el músculo** (proceso Node, nuevo)
   - Bot WhatsApp 24/7 con anti-baneo estilo Vendalo
   - Trend Scout (scraping de tendencias)
   - Agentes de larga duración sin límites de timeout
   - Migrable a VPS (~$5/mes) sin cambios de diseño

**Capa de agentes (API de Claude):**
- **CMO Agent** (cerebro): Daily Brief, decisiones, chat/voz del HUD, coordina al resto
- Agentes especializados por módulo: Hook Hunter, Trend Scout, Auditor, Prospector, Carrusel Writer, etc.
- Autonomía por agente y por marca: **Manual** (no hace nada solo) → **Copiloto** (deja borradores en cola de aprobación) → **Auto** (ejecuta dentro de reglas y límites)
- Toda acción de agente queda registrada en bitácora auditable (`agent_runs`)

**Conexiones externas:**
- Ya disponibles: YouTube Data API (heredada), API de Claude
- Diferidas a trámites Meta: Instagram Graph API, Meta Ads API
- WhatsApp: librería no-oficial en el runner (independiente de Vendalo)

## 4. Módulos (19, en 5 grupos)

### Centro
- **Dashboard** — command center por marca: KPIs de todos los canales, agentes activos, alertas, accesos rápidos.
- **Daily Brief** — parte matutino generado por el CMO Agent: qué pasó ayer, qué hacer hoy, alertas y oportunidades.
- **Inbox** — bandeja unificada de comentarios/DMs/menciones con respuestas sugeridas por IA para aprobar.

### Canales
- **YouTube** (ya anda) — métricas y snapshots heredados + análisis IA por video.
- **Instagram** (Meta) — reels, posts, demografía, competencia. Carga manual primero, API después.
- **TikTok** (API de TikTok) — videos, views, seguidores, tendencias del FYP. Demo primero; API en Fase 7 (agregado 2026-06-12 a pedido de Gio).
- **Meta Ads** (Meta) — campañas, gasto, ROAS, creativos ganadores. Demo/manual primero.
- **Bot WhatsApp** (runner) — bot propio con anti-baneo: conversaciones, embudos, respuestas IA por marca.

### Crecimiento
- **Prospección** — base de prospects por marca: captura, enriquecimiento IA, listas, etiquetas, seguimiento.
- **Ventas** — pipeline simple: lead → contactado → demo → cierre; ingresos y conversión, conectado a Prospección.

### Contenido
- **Content Calendar** — calendario editorial multi-marca con estados (idea → borrador → aprobado → publicado); los agentes proponen huecos.
- **Carrusel Studio** — la IA escribe slides desde un hook/tema, con plantillas visuales exportables.
- **Hook Bank** — banco de ganchos: se guardan hooks, la IA genera variantes por marca y clasifica por tema/rendimiento.
- **Trend Scout** (runner) — rastreo de tendencias (temas, hashtags, audios, formatos); la IA filtra lo relevante por marca.
- **Video Analysis** — desglose IA de un video (propio o de competencia): hook, estructura, ritmo, CTA.

### Inteligencia
- **Audit Inbox** — auditorías periódicas: un agente revisa un canal completo y deja informe con acciones priorizadas.
- **Skills Library** — playbooks y prompts que usan los agentes, editables y versionados.
- **Agentes (System)** — panel de control: autonomía por agente/marca, reglas, límites, bitácora, costo de API.
- **Jarvis HUD** — fullscreen: orbe 3D audio-reactivo + chat y voz con el CMO Agent, con capacidad de ejecutar acciones.

## 5. Modelo de datos (Supabase)

Tablas nuevas principales (todas con `brand_id` salvo las globales, RLS de usuario único como las existentes):

- `brands` — las 5 marcas/workspaces (nombre, slug, color, icono)
- `snapshots` (existente) — se le agrega `brand_id`
- `content_items` — calendario editorial: tipo, estado, fecha programada, payload
- `hooks` — texto, fuente, tags, score, variantes generadas
- `prospects` — nombre, handle, fuente, etapa, tags, enriquecimiento (jsonb)
- `deals` — pipeline de ventas: prospect, etapa, valor
- `trends` — fuente, tema, score, relevancia por marca
- `inbox_items` — canal, tipo, contenido, estado, respuesta sugerida
- `audits` — canal, informe, acciones
- `skills` — playbooks/prompts versionados
- `agent_settings` — autonomía y reglas por agente y por marca
- `agent_runs` — bitácora: agente, marca, acción, input/output, costo, estado
- `jobs` — cola de trabajos para el runner: tipo, payload, estado, reintentos
- `wa_sessions`, `wa_conversations`, `wa_messages` — datos del bot WhatsApp

## 6. Fases de construcción

Cada fase termina desplegada y funcionando en producción.

1. **Metamorfosis** — rebrand a Vantage Studio, tema command-center (oscuro/mono/neón), navegación agrupada + selector de marca, modelo multi-marca en Supabase, Dashboard con KPIs (YouTube real + tarjetas demo), panel de Agentes básico (autonomía + bitácora vacía).
2. **El cerebro** — CMO Agent con API de Claude: Daily Brief diario por cron, chat de texto global, Skills Library v1, alertas inteligentes.
3. **Jarvis HUD** — orbe 3D audio-reactivo (Three.js), chat fullscreen que ejecuta acciones, voz completa al cierre de la fase.
4. **Fábrica de contenido** — Hook Bank, Content Calendar, Carrusel Studio, Video Analysis, con agentes en modo Copiloto.
5. **El músculo** — runner Node + cola `jobs`; primero Trend Scout, luego Bot WhatsApp con anti-baneo.
6. **Crecimiento** — Prospección + Ventas + Inbox unificado (con lo disponible sin Meta).
7. **Conexiones externas** — Instagram Graph, TikTok API y Meta Ads pasan de demo a real; Audit Inbox con datos reales.

## 7. Manejo de errores y guardarraíles

- **Agentes:** todo run queda en `agent_runs` con estado y error; presupuesto máximo de API por día (configurable); el modo Auto exige reglas con límites explícitos y tiene kill switch global en el panel de Agentes.
- **Cola de trabajos:** reintentos con backoff; trabajos huérfanos (runner apagado) se marcan y aparecen como alerta en el Dashboard y el Daily Brief.
- **Crons:** fallos de snapshot se reportan en el Daily Brief (patrón heredado del cron actual).
- **WhatsApp:** mismas defensas que Vendalo — delays humanizados, horarios, freno de calidad, y el módulo se pausa solo ante señales de riesgo.
- **Módulos Meta en modo demo:** marcados visualmente como DEMO para no confundir datos reales con ejemplo.

## 8. Testing

- Se mantiene el patrón del repo: tests por fase que deben pasar antes de desplegar (como Oriole/Vendalo).
- Unit: motor de reglas de autonomía, builders de prompts, cálculo de KPIs/scores.
- Integración: API routes (incluida la cola de jobs) y crons con secret.
- Smoke E2E (Playwright): navegación entre marcas y módulos, render del Dashboard y del HUD.

## 9. Pendientes de Gio (no bloquean el diseño)

- Llave de API de Claude (`ANTHROPIC_API_KEY`) para la capa de agentes (desde Fase 2).
- Pendientes heredados de Dashboard Social: `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` en Vercel + usuario auth en Supabase.
- Trámites Meta (app en Meta Developers) — solo para Fase 7.
- Decidir si el runner se queda en la Mac o se muda a VPS (Fase 5+).
