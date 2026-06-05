# Dashboard Social — Diseño

**Fecha:** 2026-06-05
**Estado:** Aprobado por Gio en sesión de brainstorming
**Carpeta del proyecto:** `/Users/usuario/Desktop/social dashboard`

## 1. Visión

App personal (un solo usuario: Gio) que centraliza en un solo lugar:

1. **Métricas** de sus redes sociales con histórico y vista panorámica comparativa
2. **Mensajería**: Telegram completo y actividad de Discord
3. **Capa de IA estilo "coach"**: alertas, ideas de contenido con guión, análisis de audiencia, asistente conversacional

Inspirada en el dashboard de referencia "Dashboard Daniela" (capturas en la carpeta del proyecto), pero más amplia: la referencia solo cubre IG + TikTok y no tiene mensajería.

**No es un SaaS.** Sin multi-tenant, sin landing, sin cobros. Las apps de desarrollador de cada plataforma se registran en modo personal/desarrollo para evitar revisiones.

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Alcance | Solo uso personal |
| Stack | Next.js (App Router) + Supabase + Vercel |
| Histórico | Sí: snapshots diarios en Supabase, gráficas de evolución |
| WhatsApp | Sin integración de datos (no hay API personal y se descartó la vía no oficial por riesgo de ban). Tarjeta de acceso rápido que abre WhatsApp Web |
| X (Twitter) | Sin API (cuesta ~$200 USD/mes). Tarjeta de acceso rápido |
| Telegram | Chat completo dentro de la app vía API oficial (GramJS **en el navegador**; la sesión vive en localStorage, nunca pasa por el servidor) |
| Discord | Bot oficial para servidores (menciones + actividad por canal, vía polling REST) + enlace rápido para DMs (los DMs personales no tienen vía oficial) |
| Instagram/Facebook | Meta Graph API (requiere cuenta Business/Creator vinculada a página de FB; app en modo desarrollo, sin app review) |
| TikTok | Display API oficial (requiere aprobación de app de desarrollador; puede tardar días) |
| YouTube | Data API + Analytics API (API key + OAuth de Google, gratis) |
| IA | API de Claude (modelos Claude 4.x), costo estimado < $2 USD/mes para uso personal |
| Login | Supabase Auth, una sola cuenta permitida (la de Gio) |

## 3. Estructura de navegación (aprobada)

Sidebar fijo, basado en la referencia. Cabecera: foto + nombre + "Actualizado hh:mm" + ★ Score N/100.

**Bloque analítica/contenido:**

1. 🏠 **Inicio** — saludo + fecha, zona de alertas, "esto te toca hoy", redes lado a lado, pendientes de mensajería, accesos rápidos (WhatsApp ↗, X ↗, Discord DMs ↗)
2. 🗂 **Posts** — posts de todas las redes en columnas paralelas, filtros por tipo (Reels/Videos/Fotos) y orden; abajo: hashtags top, series detectadas, patrón de videos, mejor hora — calculado sobre todas las redes
3. 📈 **Constancia** — racha actual, días activos (ventana 35d), heatmap calendario, total de posts
4. 💡 **Ideas IA** — idea del día (título + hook + formato) con guión completo; ideas de la semana priorizadas; guardadas/descartadas
5. 💬 **Asistente** — chat con Claude con contexto de los datos propios ("¿por qué bajó mi engagement este mes?")
6. 🧠 **Mi audiencia** — resumen IA de comentarios reales: sentimiento (% pos/neu/neg), temas que dominan, palabras repetidas, citas textuales → ideas derivadas; botones "Regenerar análisis" y "Traer comentarios nuevos"
7. 🎙 **Mi voz** — perfil de tono/estilo que la IA extrae de captions y posts propios; alimenta Ideas IA y Asistente; editable a mano
8. 🎬 **Próximos** — pipeline de contenido: idea aceptada → grabando → listo para publicar (estados manuales)
9. 📅 **Calendario** — vista mensual combinando publicado (APIs) y planeado (Próximos)
10. 📊 **Tendencias** — *alcance limitado*: YouTube trending (API oficial) + sección curada; TikTok/IG no exponen trends por API
11. 👥 **Referentes** — cuentas benchmark junto a las propias: IG vía Business Discovery (solo cuentas business/creator) y YouTube (datos públicos); TikTok solo registro manual
12. 🤝 **Campañas** — registro manual de colabs con marcas: entregables, fechas, estado, pago

**Bloque mensajería (separador):**

13. ✈️ **Telegram** — lista de chats con no leídos + conversación completa (leer/responder) + búsqueda; badge de no leídos en el menú
14. 🎮 **Discord** — menciones a Gio primero, luego servidores → canales con mensajes nuevos; "abrir en Discord ↗" por canal; badge en el menú

**Bloque inferior:**

- ⚙️ **Ajustes** — estado de conexiones por plataforma (con re-conexión cuando un token expira), tarjetas visibles y su orden, hora del snapshot, cuenta
- 🔄 **Actualizar datos** — botón que dispara el refresh bajo demanda (como en la referencia)

### Principio de "vista panorámica"

No hay pestañas por red: **cada sección presenta las redes como columnas paralelas** (IG | TikTok | YouTube | 𝕏-manual) con los mismos criterios, para comparar de un vistazo. Las plataformas sin datos (X) aparecen como columna atenuada con enlace externo.

## 4. Arquitectura

```
APIs oficiales (Meta · TikTok · YouTube · Discord)
        │  crons en Vercel:
        │   /api/cron/snapshot   1×/día  → métricas + posts + comentarios
        │   /api/cron/discord    15 min  → actividad/menciones (REST polling)
        │   /api/cron/analyze    semanal → comentarios nuevos → Claude → insights
        │   /api/refresh         bajo demanda (botón "Actualizar datos")
        ▼
     Supabase (Postgres + Auth + RLS)
        ▼
  Navegador: app Next.js
        └─ Telegram: GramJS client-side ⇄ Telegram (MTProto/WebSocket).
           Sesión en localStorage. Cero datos de chats en Vercel/Supabase.
```

### Modelo de datos (Supabase)

- `snapshots` — 1 fila por plataforma/día: seguidores, alcance, impresiones, engagement, views, horas vistas (campos nullable según plataforma)
- `posts` — posts/videos importados: plataforma, id externo, tipo, caption, fecha, métricas por post (views, likes, comentarios), hashtag list
- `comments` — comentarios descargados: plataforma, post_id, autor (solo handle), texto, fecha
- `ai_insights` — análisis generados: tipo (audiencia/voz), contenido JSON, fecha, rango de datos analizado
- `content_ideas` — ideas IA: título, hook, formato, guión, prioridad, estado (nueva/guardada/descartada/aceptada→Próximos)
- `pipeline_items` — Próximos: idea_id opcional, título, estado (idea/grabando/listo), fecha objetivo
- `campaigns` — Campañas: marca, entregables, fechas, estado, monto
- `references_accounts` — Referentes: plataforma, handle, snapshots públicos
- `discord_activity` — servidor, canal, autor, extracto, es_mención, fecha
- `platform_tokens` — tokens OAuth cifrados + expiración + estado
- `settings` — preferencias de UI y del snapshot

RLS en todas las tablas, restringido al user id de Gio.

### Cálculos (sin IA, código puro)

- Mediana de views/engagement por plataforma → alertas "está rompiendo" (umbral: > +50% sobre mediana de últimos 21 posts)
- Racha y heatmap desde fechas de `posts`
- Mejor hora: engagement promedio por franja horaria/día de semana
- Hashtags top: engagement relativo vs mediana
- Score 0-100: combinación ponderada de constancia (40%) + crecimiento (30%) + engagement (30%); fórmula ajustable en una sola función

### Capa IA (API de Claude)

- **Mi audiencia**: batch de comentarios nuevos → resumen, sentimiento, temas, citas → `ai_insights`
- **Ideas IA**: contexto = mi voz + posts top + análisis de audiencia → ideas con guión
- **Asistente**: chat con tool-use de solo lectura sobre Supabase (consultas agregadas, nunca tokens)
- **Mi voz**: análisis periódico de captions propios → perfil de tono editable

## 5. Manejo de errores

- Cron por plataforma aislado: si TikTok falla, las demás guardan igual; el fallo queda registrado en `platform_tokens.estado`
- Token expirado → banner en Inicio "X necesita reconexión" + botón de re-auth (Meta expira ~60 días)
- Rate limits: llamadas espaciadas; ante 429, reintento al día siguiente (con snapshot diario se está lejos de los límites)
- Telegram: si la sesión del navegador caduca, la vista muestra re-login por QR/código sin afectar el resto de la app
- Días sin snapshot (cron caído): las gráficas interpolan y se marca el hueco

## 6. Seguridad

- Supabase Auth con email fijo permitido (gio.park.4444@gmail.com); cualquier otro login se rechaza
- RLS en todas las tablas
- Tokens OAuth cifrados (AES) con clave en variables de entorno de Vercel
- API key de Claude y secretos solo en Vercel env vars
- Crons protegidos con `CRON_SECRET`
- Sesión de Telegram exclusivamente client-side

## 7. Testing

- Unit tests: cálculos (medianas, racha, mejor hora, Score), parsers de cada API (fixtures con respuestas reales simuladas)
- Tests de integración por adaptador de plataforma con mocks HTTP
- Verificación manual con Playwright al cierre de cada fase
- La capa IA se prueba con prompts fijos + validación de estructura del JSON de salida

## 8. Fases de construcción

| Fase | Entregable | Trámite previo |
|---|---|---|
| 1 | Esqueleto: Next.js + Supabase + Auth + sidebar completo (rubros vacíos con "próximamente") + tarjetas de acceso rápido + YouTube con snapshots e Inicio panorámico básico | API key Google (10 min) |
| 2 | Telegram chat completo + badges | my.telegram.org (5 min) |
| 3 | Discord: bot + menciones + actividad | Developer Portal (10 min) |
| 4 | Instagram/Facebook: métricas + posts + comentarios | Cuenta Business + app Meta (30 min) |
| 5 | TikTok: métricas + posts | App TikTok dev (aprobación: días) |
| 6 | Analytics: alertas, mejor hora, hashtags, Constancia, Score, Posts panorámico completo | — |
| 7 | Capa IA: Mi audiencia, Ideas IA, Mi voz, Asistente | API key de Claude |
| 8 | Módulos de gestión: Próximos, Calendario, Campañas, Referentes, Tendencias (limitado) | — |

Cada fase se despliega a producción al terminar.

## 9. Fuera de alcance (explícito)

- Publicar/programar posts en las redes (solo lectura de datos)
- WhatsApp con datos integrados (solo enlace) — revisable en el futuro si Gio acepta el riesgo de librerías no oficiales
- DMs de Discord y X por API
- Multi-usuario / comercialización
