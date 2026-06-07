# 📍 Estado y Pendientes — Dashboard Social

**Última actualización:** 2026-06-06 (sesión de documentación & testing completa)
**Rama activa:** `main` (15 commits finales) · **Repo:** https://github.com/giopark4444-commits/dashboard-social (privado)

---

## ✅ DÓNDE QUEDAMOS

### Hecho y funcionando (código 100% terminado, revisado y en GitHub)

| Pieza | Estado | Detalle |
|---|---|---|
| Spec de diseño | ✅ Aprobado | `docs/superpowers/specs/2026-06-05-dashboard-social-design.md` |
| Plan Fase 1 | ✅ Ejecutado | `docs/superpowers/plans/2026-06-05-fase1-esqueleto-youtube.md` |
| App Next.js 16 | ✅ | En `web/`, build limpio, 5/5 tests pasando |
| Login usuario único | ✅ | Solo `gio.park.4444@gmail.com` puede entrar (proxy + ALLOWED_EMAIL) |
| Sidebar 14 rubros | ✅ | Colapsable (botón «/»), iconos centrados en modo angosto; rubros futuros muestran "Próximamente — Fase X" |
| Inicio panorámico | ✅ | Columnas lado a lado: IG (placeholder F4), TikTok (placeholder F5), **YouTube (real)**, X (enlace) + accesos rápidos WhatsApp/X/Discord |
| Base de datos | ✅ | Supabase proyecto `dashboard-social` (ref `dhjkrrokvovlxmiuihxm`, $0/mes), tabla `snapshots` con RLS aplicada y verificada |
| Adaptador YouTube | ✅ | Con tests (TDD); lee stats públicas del canal con API key |
| Cron diario + botón refresh | ✅ | `/api/cron/snapshot` (6:00 a.m. Colombia vía vercel.json) y "● Actualizar datos"; probados localmente |
| Revisión final | ✅ | Veredicto: READY TO DEPLOY, 0 issues críticos/importantes |

### Verificado localmente
- Redirección de auth funciona (sin login → /login)
- Cron: 401 sin secret; con secret responde y aísla el fallo de YouTube (esperado: aún sin credenciales)
- `npm test` → 5/5 · `npx next build` → limpio

---

## ⏸️ PRÓXIMA SESIÓN: CREDENCIALES PENDIENTES (35 min)

**Los 3 trámites de credenciales + usuario Supabase + testing** (~35 min total, requieren TUS cuentas — yo no puedo hacerlos):

1. **Supabase** → https://supabase.com/dashboard/project/dhjkrrokvovlxmiuihxm/auth/users
   - a) Authentication → Users → **Add user**: email `gio.park.4444@gmail.com` + contraseña (marcar "Auto Confirm User"). *Sin esto no puedes hacer login en tu propia app.*
   - b) Authentication → Sign In/Providers → **desactivar "Allow new users to sign up"**
   - c) Project Settings → API Keys → copiar la **`service_role`** key
2. **Google Cloud** → https://console.cloud.google.com → proyecto nuevo → habilitar **YouTube Data API v3** → Credentials → **API key**
3. **YouTube Studio** → Configuración → Canal → Avanzada → copiar **Channel ID** (`UC…`)

> Los 3 valores van en `web/.env.local`, donde hoy dicen `PENDIENTE_GIO`. El resto del archivo ya está lleno (URL y anon key de Supabase reales, CRON_SECRET generado).

---

## 🔜 QUÉ QUEDA POR HACER

### Para cerrar la Fase 1 (en orden)
1. Los 3 trámites de arriba → pasar los valores a Claude (o editar `web/.env.local` a mano)
2. Probar login + primer snapshot real en local (`cd web && npm run dev`)
3. **Deploy a Vercel** (Task 10 del plan): importar el repo de GitHub, **Root Directory = `web`** ⚠️, cargar las 7 variables de `.env.example` en Settings → Environment Variables, verificar que el cron aparezca en Settings → Cron Jobs
4. Merge `fase-1` → `main`

### Fases siguientes (del spec)
| Fase | Qué agrega | Trámite previo de Gio |
|---|---|---|
| 2 | ✈️ Telegram chat completo en la app | App en my.telegram.org (5 min) |
| 3 | 🎮 Discord: menciones + actividad de servidores | Bot en Discord Developer Portal (10 min) |
| 4 | 📸 Instagram/Facebook: métricas + comentarios | Cuenta IG Business + app en Meta for Developers (30 min) |
| 5 | 🎵 TikTok: métricas | App en TikTok for Developers (aprobación tarda DÍAS — iniciarla con tiempo) |
| 6 | 📊 Alertas "post rompiendo", mejor hora, hashtags, Constancia, Score | — |
| 7 | 🧠 Capa IA: Mi audiencia, Ideas IA, Mi voz, Asistente | API key de Claude |
| 8 | 🎬 Próximos, Calendario, Campañas, Referentes, Tendencias | — |

### Detalles menores anotados (no urgentes)
- `web/README.md` sigue siendo el boilerplate de create-next-app
- El layout consulta `snapshots` también en /login (round-trip innecesario, inofensivo)
- Decisiones de diseño visual (tema/colores/logo) quedaron abiertas — los mockups exploratorios viven en `.superpowers/brainstorm/` (no versionado)

---

## ▶️ CÓMO RETOMAR

En cualquier sesión de Claude Code, di:

> **"sigamos con el dashboard social"**

Claude tiene el estado guardado en su memoria persistente. El siguiente paso exacto está documentado en:

**👉 [PROXIMA-SESION.md](PROXIMA-SESION.md)** — Checklist completo paso a paso (35 min para terminar)

## 🗺️ Mapa de documentos

| Documento | Qué contiene |
|---|---|
| `docs/ESTADO-Y-PENDIENTES.md` | **Este archivo** — estado, saltado, pendiente |
| `docs/superpowers/specs/2026-06-05-dashboard-social-design.md` | El diseño completo aprobado (14 rubros, arquitectura, 8 fases) |
| `docs/superpowers/plans/2026-06-05-fase1-esqueleto-youtube.md` | Plan paso a paso de la Fase 1 (ejecutado) |
| `docs/bitacora-sesion-brainstorming.md` | Cómo se llegó al diseño (todos los prompts y decisiones) |
| `docs/log-implementacion-fase1.md` | Log técnico de la implementación (commits, reviews, incidencias) |
| `web/.env.example` | Las 7 variables de entorno que necesita la app |
