# Bitácora de la sesión de brainstorming — Dashboard Social

**Fechas:** 2026-06-04 (noche) → 2026-06-05
**Participantes:** Gio + Claude (Opus 4.8) en Claude Code
**Resultado:** Spec de diseño aprobado y commiteado

Registro cronológico de cada prompt de Gio y lo que se hizo con él.

---

## 1. Prompt inicial — la idea

> "quiero hacer una app que sea un dashboard social que me de toda la info de mis redes sociales e incluso whasapp y telegram"

**Qué se hizo:** Se activó el proceso de brainstorming (nada de código hasta tener diseño aprobado).

## 2. Investigación previa

> "pero antes de hacerla ayudame a ver que es todo lo necesario e importante para poder hacer algo que realmente valga la pena"

**Qué se hizo:** Mapa de viabilidad por plataforma:

- ✅ YouTube: API oficial gratis y fácil
- ✅ Instagram/Facebook: Meta Graph API gratis, requiere cuenta Business/Creator
- ✅ Telegram: API oficial completa y abierta (la mejor de todas)
- ⚠️ TikTok: Display API oficial, requiere aprobar app de desarrollador
- ⚠️ X (Twitter): API de lectura ~$200 USD/mes
- 🔴 WhatsApp: sin API para cuentas personales; solo webview o librerías no oficiales (riesgo de ban)

## 3. Análisis de competencia

> "busca si ya hay aplicaciones que hagan esto y mira que es todo lo que puedes aprender de ellas"

**Qué se hizo:** Investigación web. Dos familias de apps:

- **Métricas** (Hootsuite, Metricool, Buffer, Sprout Social) — APIs oficiales, sin WhatsApp/Telegram
- **Mensajería unificada** (Beeper con bridges, Ferdium/Rambox con webviews) — sin métricas

**Lecciones:** 3 estrategias técnicas (APIs oficiales / protocolo inverso / webviews); el hueco es la combinación métricas + mensajes; WhatsApp nadie lo resuelve bien.

## 4. Decisiones por preguntas (una a la vez)

| Pregunta | Respuesta de Gio |
|---|---|
| ¿Qué tipo de info? | **Todo** (métricas + mensajes + resumen) |
| ¿Personal o SaaS? | **Solo para mí** |
| ¿Qué plataformas? | **Todas**: IG/FB, WhatsApp, Telegram, TikTok, YouTube, X |
| ¿WhatsApp cómo? | **Webview segura** (sin riesgo de ban) |
| ¿Formato de la app? | **App web local** (Next.js, su stack) → WhatsApp queda como enlace |
| ¿X con su API de $200/mes? | **Solo enlace/acceso rápido** |
| ¿Histórico de métricas? | **Sí, con histórico** (snapshots diarios + gráficas) |
| ¿Telegram qué tanto? | **Chat completo dentro de la app** |
| (Agregado después) ¿Discord? | **Ambos**: bot para servidores + enlace para DMs |

## 5. Enfoques de arquitectura

Se propusieron 3: **A)** nube Vercel + Supabase · **B)** todo local con SQLite · **C)** empezar mínimo y crecer por fases.

**Elegido: A + fases de C** — snapshots corren aunque la Mac esté apagada, accesible desde el teléfono, stack conocido. Telegram corre en el navegador (GramJS) para que los chats nunca pasen por el servidor.

## 6. Presentación del diseño por secciones

- **Sección 1 — Pantallas:** aprobada ("si, todo bien, continua")
- **Sección 2 — Arquitectura y datos:** crons de Vercel, tablas Supabase, manejo de tokens
- **Sección 3 — Integraciones y fases:** orden de lo fácil a lo burocrático

## 7. Imágenes de referencia (app de un influencer)

> "voy a mostrarte unas imagenes… son de un influencer que hizo una app similar, dime si estamos aun mejor que ellos y lo que no hayamos pensado"

**Qué se hizo:** Análisis de las 10 capturas ("Dashboard Daniela", IG 1.9M / TikTok 3.2M) en la carpeta del proyecto:

- Su app: saludo personalizado, Score /100, constancia/racha con heatmap, Ideas IA con guión, análisis de audiencia desde comentarios reales, hashtags/series/patrones, mejor hora
- **Veredicto:** ellos ganan en capa IA "coach"; nosotros en amplitud (más redes + mensajería)
- Gio decidió integrar **las 4 funciones**: análisis y alertas, Mi audiencia IA, Ideas IA, Score

## 8. Modelo y propuestas visuales

> "me puedes decir que modelo de claude estas usando y me puedes mostrar… un par de propuestas mas de diseño tipo themes, pero juega con arquitecturas totalmente diferentes"

**Qué se hizo:** Se confirmó el modelo (Claude Opus 4.8) y se activó el companion visual en el navegador (localhost). Pantallas mostradas:

1. **Propuestas A/B/C:** Clásico Pro (sidebar) · Centro de Comando (bento oscuro, una pantalla) · Feed Asistente (timeline tipo asistente personal)
2. **Propuestas D/E/F** (a pedido: "hazme mas opciones asi como las que te di en las fotos… y logos minimalistas de un solo color"): Crema Editorial · Tinta Minimal · Coach Cálido + logos **Pulso / Órbita / Nodo**
3. **Matriz 9 combos** diseño × logo ("muestrame los 3 diseños con los tres logos en mockup")

> "no me gusta ninguno, pense que me mostrarias como quedaria la arquitectura de la app, como se verian los menus y como estaria estructurado"

4. **Estructura en wireframes grises:** mapa del menú, esqueleto de cada pantalla, diagrama de flujo de datos

*Nota: el servidor visual se apaga tras 30 min de inactividad; hubo que reiniciarlo una vez (cambió el puerto).*

## 9. El menú definitivo

> "[foto del sidebar de Daniela] esos son los rubros basicos que quiero, reorganiza todo para que sea posible, las redes sociales ya salen dentro del cuerpo de la app en cada pestaña una al lado de la otra para asi poderlas comparar y tener una vista mas panoramica de todo"

**Qué se hizo:** Menú reorganizado con los rubros de la referencia + viabilidad de cada uno, y el principio de **vista panorámica** (redes en columnas paralelas, sin pestañas por red):

🏠 Inicio · 🗂 Posts · 📈 Constancia · 💡 Ideas IA · 💬 Asistente · 🧠 Mi audiencia · 🎙 Mi voz · 🎬 Próximos · 📅 Calendario · 📊 Tendencias (parcial) · 👥 Referentes (parcial) · 🤝 Campañas — separador — ✈️ Telegram · 🎮 Discord — abajo — ⚙️ Ajustes · 🔄 Actualizar datos

**Aprobado:** "si, asi esta bien"

## 10. Spec final

Escrito, auto-revisado y commiteado en git:

- 📄 `docs/superpowers/specs/2026-06-05-dashboard-social-design.md`
- Commit inicial del repo: `4ee4fc7`

## Estado actual y siguiente paso

- ✅ Investigación, decisiones, diseño y spec: **completos**
- ⏳ Pendiente: revisión final del spec por Gio
- ⏳ Siguiente: plan de implementación de la **Fase 1** (esqueleto Next.js + Supabase + Auth + YouTube + Inicio panorámico) y construcción

### Trámites que Gio tendrá que hacer cuando toque cada fase

1. API key de Google/YouTube (10 min) — Fase 1
2. App en my.telegram.org (5 min) — Fase 2
3. Bot en Discord Developer Portal (10 min) — Fase 3
4. Cuenta IG Business + app en Meta for Developers (30 min) — Fase 4
5. App en TikTok for Developers (aprobación tarda días) — Fase 5
6. API key de Claude — Fase 7
