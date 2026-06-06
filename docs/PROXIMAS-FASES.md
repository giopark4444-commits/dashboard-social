# 🔮 Próximas Fases — Dashboard Social

**Fase Actual:** 1 (MVP — YouTube)  
**Estado:** ✅ Completa  
**Próxima:** Fase 2 (Telegram)

---

## 📋 Mapa de Fases (Visión Completa)

| Fase | Feature | Esfuerzo | Dependencia | Estimado |
|------|---------|----------|-------------|----------|
| 1 | YouTube API (stats públicas) | 2 días | ✅ Hecho | 2026-06-05 ✅ |
| 2 | Telegram (chat + stats) | 1 día | App de Telegram | 2026-06-10 |
| 3 | Discord (menciones + servidores) | 1.5 días | Bot en Discord Dev Portal | 2026-06-15 |
| 4 | Instagram/Facebook (métricas) | 2 días | Cuenta IG Business | 2026-06-25 |
| 5 | TikTok (métricas) | 1 día | App en TikTok Dev (⚠️ espera días) | 2026-07-10 |
| 6 | Alertas (post rompiendo, horarios, hashtags) | 2 días | Backend | 2026-07-15 |
| 7 | Capa IA (análisis, ideas, asistente) | 3 días | Claude API key | 2026-07-25 |
| 8 | Calendario + Referentes + Tendencias | 2 días | UI/UX | 2026-08-01 |

---

## 🔗 Fase 2: Telegram (Chat + Stats)

**Objetivo:** Integrar Telegram para ver estadísticas de canal y chat directo en la app

### Qué se agregaría
- 📊 Stats del canal Telegram (seguidores, mensajes)
- 💬 Chat inline en la app (ver/enviar mensajes)
- 🔔 Notificaciones de nuevos mensajes
- 📱 Columna "Telegram" en dashboard

### Dependencias (5 min de config)

**1. Crear app de Telegram** (my.telegram.org)

```
1. Ir a https://my.telegram.org/
2. Login con tu cuenta Telegram
3. Go to "API development tools"
4. Create new application
5. Copiar: API_ID y API_HASH
6. Guardar: Estas van en env vars
```

**2. Obtener bot token** (Telegram BotFather)

```
1. En Telegram, buscar @BotFather
2. /newbot
3. Elegir nombre (ej: DashboardBot)
4. Copiar: Token (formato 123456789:ABCdefGHI...)
5. Guardar en env vars
```

### Variables de entorno a agregar

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIJK...
TELEGRAM_API_ID=1234567
TELEGRAM_API_HASH=abcdef1234567890
TELEGRAM_CHANNEL_ID=-1001234567890
```

### Implementación (plan técnico)

```
src/lib/platforms/telegram.ts
├─ fetchTelegramStats() - obtener stats del canal
├─ getTelegramMessages() - obtener últimos mensajes
└─ sendTelegramMessage() - enviar mensaje desde la app

src/app/api/telegram/send/route.ts
├─ POST /api/telegram/send - endpoint para enviar

src/components/PlatformColumn.tsx
├─ Nueva sección "Telegram"
├─ Mostrar stats
└─ Widget de chat inline
```

### Testing
- [ ] Conectar a bot
- [ ] Obtener stats en tiempo real
- [ ] Enviar/recibir mensajes
- [ ] Probar en Vercel

---

## 🎮 Fase 3: Discord (Menciones + Servidores)

**Objetivo:** Ver actividad de Discord y menciones en tiempo real

### Qué se agregaría
- 🎮 Menciones en servidores
- 👥 Actividad de miembros
- 📊 Stats de servidores
- 🔔 Notificaciones de actividad

### Dependencias (10 min)

**1. Crear app en Discord Developer Portal**

```
1. Ir a https://discord.com/developers/applications
2. New Application
3. General Information → copiar CLIENT_ID
4. OAuth2 → copiar SECRET
5. Bot → Create Bot → copiar TOKEN
```

**2. Invitar bot a servidor**

```
1. OAuth2 → URL Generator
2. Scopes: bot
3. Permissions: Read Messages, Send Messages, View Channels
4. Copiar URL generada
5. Abrir en navegador e invitar a servidor
```

### Variables de entorno

```env
DISCORD_BOT_TOKEN=MzA0...
DISCORD_GUILD_ID=1234567890
DISCORD_CLIENT_ID=123456789
DISCORD_SECRET=abc...
```

### Implementación

```
src/lib/platforms/discord.ts
├─ fetchDiscordMentions() - obtener menciones
├─ fetchGuildStats() - stats del servidor
└─ getRecentActivity() - actividad reciente

src/components/DiscordWidget.tsx
├─ Mostrar menciones
├─ Actividad timeline
└─ Stats
```

---

## 📸 Fase 4: Instagram/Facebook (Métricas)

**Objetivo:** Métricas de Instagram Business + comentarios

### Qué se agregaría
- 📷 Últimos posts
- ❤️ Engagement (likes, comments)
- 👥 Follower growth
- 💬 Top comments

### Dependencias (30 min)

**1. Convertir cuenta a Instagram Business**

```
1. Ir a Instagram Settings → Account
2. Switch to Professional Account
3. Category: Creator
```

**2. Crear app en Meta for Developers**

```
1. Ir a https://developers.facebook.com/
2. Create App
3. App type: Consumer
4. Agregar producto: Instagram Basic Display + Graph API
5. Configurar OAuth redirect URI
```

**3. Obtener credenciales**

```
- App ID
- App Secret
- User Access Token
```

### Variables de entorno

```env
FACEBOOK_APP_ID=123456789
FACEBOOK_APP_SECRET=abc...
INSTAGRAM_USER_ID=1234567890
INSTAGRAM_ACCESS_TOKEN=IGQVJu...
```

---

## 🎵 Fase 5: TikTok (Métricas)

**Objetivo:** Stats de TikTok (⚠️ requiere aprobación)

### Qué se agregaría
- 📊 Seguidores, likes totales
- 🎬 Últimos videos
- 📈 Engagement rate

### ⚠️ IMPORTANTE: TikTok requiere aprobación

La aprobación puede tomar **DÍAS O SEMANAS**. **Iniciar temprano.**

### Dependencias (días)

**1. Solicitar acceso a TikTok API**

```
1. Ir a https://developer.tiktok.com/
2. Create App
3. Select: TikTok Content Posting API + TikTok Insights
4. Enviar application for review
5. Esperar aprobación (días)
```

### Variables de entorno (después de aprobación)

```env
TIKTOK_CLIENT_ID=123456789
TIKTOK_CLIENT_SECRET=abc...
TIKTOK_ACCESS_TOKEN=...
TIKTOK_USER_ID=1234567890
```

---

## 📊 Fase 6: Alertas (Post rompiendo, Horarios, Hashtags)

**Objetivo:** Notificaciones inteligentes

### Qué se agregaría
- 🚨 Alert si post "está rompiendo" (viralizándose)
- 🕐 Notificación mejor hora para publicar
- #️⃣ Hashtags trending relevantes
- 📈 Constancia tracking

### Lógica

```
1. Fetch stats cada 30 min
2. Calcular "viral score" vs histórico
3. Si supera threshold → notificación
4. Sugerir mejor hora según datos históricos
5. Scrape hashtags trending relacionados
```

### Implementación

```
src/lib/alerts.ts
├─ checkViralScore() - detectar posts virales
├─ suggestBestTime() - mejor hora para publicar
└─ getTrendingHashtags() - hashtags del momento

src/lib/notifications.ts
├─ sendAlert() - notificación
└─ storeAlert() - guardar en BD

Nueva tabla: alerts
├─ id, timestamp, alert_type, data, read
```

---

## 🧠 Fase 7: Capa IA (Mi Audiencia, Ideas, Asistente)

**Objetivo:** Análisis inteligente con Claude

### Qué se agregaría
- 🧠 **Mi Audiencia:** Análisis de demografía + intereses
- 💡 **Ideas IA:** Sugerir ideas de contenido
- 🎙️ **Mi Voz:** Detectar tono/estilo propio
- 💬 **Asistente:** Chat para análisis

### Dependencias (1 min)

**1. Obtener API key de Claude**

```
1. Ir a https://console.anthropic.com/
2. API Keys → Create Key
3. Copiar: sk-ant-...
```

### Variables de entorno

```env
CLAUDE_API_KEY=sk-ant-...
```

### Implementación

```
src/lib/ai/
├─ analyzeAudience() - demografía
├─ generateIdeas() - ideas de content
├─ analyzeVoice() - tono/estilo
└─ chatAssistant() - chat libre

src/components/AIWidgets/
├─ AudienceAnalysis.tsx
├─ IdeaGenerator.tsx
├─ VoiceAnalyzer.tsx
└─ ChatAssistant.tsx
```

### Ejemplos de preguntas para el IA

```
"Mi audiencia mayoritariamente en qué horario está activa?"
"Basado en mis posts, qué tema me recomiendas para próximo?"
"¿Mi tono es más profesional o desenfadado?"
"¿Cuál sería un buen titulo para este idea?"
```

---

## 🎬 Fase 8: Calendario + Referentes + Tendencias

**Objetivo:** Planificación y descubrimiento

### Qué se agregaría

#### Calendario
- 📅 Próximos posts programados
- 🗓️ Histórico de publicaciones
- ⏰ Recordatorios

#### Referentes
- 👥 Perfiles similares a analizar
- 📊 Comparar métricas
- 🔍 Analizar estilo

#### Tendencias
- 📈 Trends actuales relevantes
- #️⃣ Hashtags en tendencia
- 🎬 Videos virales en tu nicho

### Implementación

```
src/components/Calendar.tsx
src/components/Referents.tsx
src/components/Trends.tsx

src/lib/calendar.ts
├─ getScheduledPosts()
├─ getPublishHistory()
└─ setReminders()

src/lib/trends.ts
├─ fetchTrendingContent()
├─ getRelevantHashtags()
└─ findSimilarCreators()
```

---

## 🛠️ Stack Tecnológico (Todas las Fases)

### Frontend (Sin cambios)
- Next.js 16
- React 19
- Tailwind CSS
- TypeScript

### Backend (Se expande)
- **APIs de plataformas:** YouTube, Telegram, Discord, Meta, TikTok
- **Cron jobs:** Vercel Cron
- **IA:** Claude API
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth

### Dependencias nuevas por fase

```
Fase 2: telegram
Fase 3: discord.js
Fase 4: instagram-graph-api (Meta SDK)
Fase 5: tiktok-api
Fase 6: (solo datos existentes)
Fase 7: @anthropic-ai/sdk
Fase 8: (componentes UI)
```

---

## 📚 Cómo Empezar una Nueva Fase

### Paso 1: Crear rama

```bash
git checkout main
git pull
git checkout -b fase-2-telegram
```

### Paso 2: Implementar

```
Seguir el plan técnico para la fase
Crear tests (TDD)
Testing local
```

### Paso 3: PR y Merge

```
git push origin fase-2-telegram
Crear PR en GitHub
Merge a main
Deploy a Vercel
```

### Paso 4: Docs

```
Actualizar GUIA-DE-USO.md
Actualizar PROXIMAS-FASES.md
Actualizar ESTADO-Y-PENDIENTES.md
```

---

## 🎯 Recomendaciones de Orden

**Orden sugerido:**
1. ✅ **Fase 1** → YouTube (HECHO)
2. **Fase 2** → Telegram (PRÓXIMO — fácil, rápido)
3. **Fase 3** → Discord (similar a Telegram)
4. **Fase 7** → IA (con datos de fases 2-3)
5. **Fase 4** → Instagram (meta requiere aprobación)
6. **Fase 5** → TikTok (requiere muchos días de aprobación)
7. **Fase 6** → Alertas (usa datos de todas)
8. **Fase 8** → Calendario/Tendencias (capas opcionales)

**Por qué este orden:**
- Las primeras fases no tienen dependencias
- TikTok requiere iniciar ASAP (aprobación lenta)
- IA es más valuable después de tener más datos

---

## 📞 Soporte para Próximas Fases

- **Docs de APIs:** Revisar en cada fase
- **Código de referencia:** Ver implementación YouTube (Fase 1)
- **Testing:** Usar mismo framework (vitest)
- **Deploy:** Mismo proceso Vercel

---

**Próxima acción:** Agregar credenciales y luego proceder a Fase 2 (Telegram)

