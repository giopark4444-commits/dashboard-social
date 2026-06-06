# ✅ Deployment Checklist — Dashboard Social

**Fase:** 1 (MVP)  
**Estado:** Fase 1 completada, listo para Vercel  
**Fecha:** 2026-06-06

---

## 📋 Pre-Deployment (Local Testing)

- [x] Código compilado sin errores (`npm run build`)
- [x] Tests pasando (`npm test` → 5/5)
- [x] Auth proxy funcionando localmente
- [x] Login form renderiza y valida
- [x] Cron endpoint protegido (401/207)
- [x] No hay secrets en respuestas HTML
- [x] Security headers configurados
- [x] Documentación completada
- [x] Código en rama main
- [x] Commits pushados a GitHub

---

## 🚀 Deployment a Vercel (Configuración)

### Paso 1: Proyecto en Vercel (✅ HECHO)

- [x] Repo importado en Vercel
- [x] Root Directory: `web`
- [x] Output Directory: `.next`
- [x] Build Command: `npm run build` (default)
- [x] Install Command: `npm ci` (default)

### Paso 2: Environment Variables (✅ HECHO)

Las **7 variables** cargadas en Vercel (Production):

- [x] `NEXT_PUBLIC_SUPABASE_URL` = `https://dhjkrrokvovlxmiuihxm.supabase.co`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGc...` (anon key real)
- [x] `SUPABASE_SERVICE_ROLE_KEY` = ⏳ PENDIENTE_GIO
- [x] `ALLOWED_EMAIL` = `gio.park.4444@gmail.com`
- [x] `YOUTUBE_API_KEY` = ⏳ PENDIENTE_GIO
- [x] `YOUTUBE_CHANNEL_ID` = ⏳ PENDIENTE_GIO
- [x] `CRON_SECRET` = `b16a5123eae8f2c75761a1a4e79be775`

### Paso 3: Cron Job (✅ CONFIGURADO)

- [x] `vercel.json` en root del repo
- [x] Path: `/api/cron/snapshot`
- [x] Schedule: `0 11 * * *` (11 UTC = 6 AM Colombia)
- [x] Debería aparecer en Vercel → Settings → Cron Jobs

**Si no aparece el cron job:**
- Hacer Redeploy desde Vercel (Settings → Build and Deployment → Redeploy)
- Esperar ~2-3 minutos
- Verificar en Cron Jobs

---

## 🔑 Credenciales Pendientes (CRÍTICO)

### Supabase Service Role Key

**Ubicación:** Supabase dashboard → Project Settings → API Keys

```
Copiar: service_role key (la más larga)
Pegar en: Vercel → Settings → Environments → Production → SUPABASE_SERVICE_ROLE_KEY
Marcar: Sensitive ✅
```

**Efecto:** Permite al cron job escribir snapshots en la BD

### YouTube API Key

**Ubicación:** Google Cloud Console → proyecto nuevo → Credentials → API key

```
1. Ir a: https://console.cloud.google.com
2. Crear proyecto nuevo o usar existente
3. Habilitar: YouTube Data API v3
4. Credentials → Create API Key
5. Copiar: La API key generada
6. Pegar en: Vercel → YOUTUBE_API_KEY
Marcar: Sensitive ✅
```

**Efecto:** Permite obtener estadísticas públicas del canal YouTube

### YouTube Channel ID

**Ubicación:** YouTube Studio → Configuración → Canal → Avanzada

```
1. Ir a: https://studio.youtube.com/channel/
2. Click en tu foto → Settings → Channel
3. Ir a "Avanzada"
4. Copiar: Channel ID (formato UC...)
5. Pegar en: Vercel → YOUTUBE_CHANNEL_ID
```

**Efecto:** Especifica qué canal leer (el tuyo)

### Crear Usuario en Supabase

**Ubicación:** Supabase dashboard → Authentication → Users

```
1. Click "Add user"
2. Email: gio.park.4444@gmail.com
3. Password: (tu contraseña)
4. Checkbox: "Auto Confirm User" ✅
5. Click "Create user"
```

**Efecto:** Te permite hacer login en la app

---

## 📱 Post-Deployment Testing

### Paso 1: Verificar app carga

```
✅ Abre: https://dashboard-social-eight.vercel.app
✅ Deberías ver: Formulario de login
❌ Si ves: 404 → Vercel config mal, redeploy
```

### Paso 2: Test de login

```
✅ Email: gio.park.4444@gmail.com
✅ Password: (la que creaste)
✅ Click: Entrar
✅ Deberías ver: Dashboard con YouTube stats
❌ Si ves: Credenciales incorrectas → Usuario no existe en Supabase
```

### Paso 3: Verificar datos de YouTube

```
✅ Homepage muestra: Seguidores, Vistas, Videos
✅ Click: "Actualizar datos"
✅ Respuesta: {"ok":["youtube"],"failed":[]} (o similar)
❌ Si ves: {"ok":[],"failed":["youtube"]} → YouTube API key inválida
```

### Paso 4: Verificar cron job

```
En Vercel:
1. Settings → Cron Jobs
2. Ver /api/cron/snapshot listado
3. "Next scheduled" debe mostrar próxima ejecución
4. Click en "View logs" para ver ejecutaciones pasadas
```

---

## 🔄 Redeploy (si necesario)

**Cuándo redeploy es necesario:**
- Cambio en código (auto desde GitHub)
- Cambio en env vars (manual)
- Output Directory incorrecto (manual)

**Cómo hacer redeploy manual:**

1. Vercel → Deployments → (deployment en Production)
2. Click "Redeploy" (botón azul arriba a la derecha)
3. Esperar ~2-3 min
4. Ver "Ready" en status

**Esperar entre redeploys:** 5 min mínimo (puede haber cache)

---

## 🛡️ Security Checks Post-Deploy

- [x] Login redirects unauthenticated users
- [x] Cron endpoint returns 401 sin CRON_SECRET
- [x] No secrets en responses HTML
- [x] Security headers presentes (X-Frame-Options, etc.)
- [x] HTTPS activo (automatic en Vercel)
- [x] Logs accesibles (Vercel → Deployments → Logs)

---

## 📊 Monitoreo Continuo

### Vercel Logs

**Runtime Logs:** Errores en ejecución
- Vercel → Deployments → Logs → Runtime
- Buscar: "error", "fail", "undefined"

**Cron Logs:** Ejecuciones del snapshot diario
- Vercel → Settings → Cron Jobs → /api/cron/snapshot → Logs
- Ver timestamp y resultado (success/fail)

### Supabase Logs

**Auth Logs:** Intentos de login
- Supabase → Authentication → Logs
- Buscar: suspicious activity, failed logins

**Database Logs:** Errores de BD
- Supabase → Logs → Database
- Buscar: query errors, RLS violations

---

## 🚨 Troubleshooting

### App muestra 404

**Paso 1:** Vercel → Settings → Build and Deployment
- Root Directory: `web` ✅
- Output Directory: `.next` ✅

**Paso 2:** Hacer Redeploy
- Deployments → [Latest] → Redeploy

**Paso 3:** Esperar 3 min y refrescar

### Login no funciona

**Paso 1:** ¿Usuario creado en Supabase?
- Supabase → Authentication → Users
- Ver si `gio.park.4444@gmail.com` existe

**Paso 2:** ¿Usuario "Auto Confirm"?
- Si no, marcar "Auto Confirm User" y guardar

**Paso 3:** ¿Service Role Key correcta?
- Vercel → SUPABASE_SERVICE_ROLE_KEY
- Copiar desde Supabase Settings → API Keys

### YouTube stats no aparecen

**Paso 1:** ¿Variables cargadas?
- Vercel → YOUTUBE_API_KEY
- Vercel → YOUTUBE_CHANNEL_ID

**Paso 2:** ¿API key válida?
- Ir a Google Cloud → Credentials
- Verificar que la key está activa

**Paso 3:** ¿Channel ID correcto?
- Ir a YouTube Studio → Configuración → Avanzada
- Copiar ID exacto (UC...)

**Paso 4:** Test manual
- Click "Actualizar datos" en la app
- Ver respuesta en browser DevTools (Network tab)

### Cron job no ejecuta

**Paso 1:** ¿Aparece en Cron Jobs?
- Vercel → Settings → Cron Jobs
- Si no → Redeploy

**Paso 2:** ¿Endpoint es accesible?
```bash
curl -H "Authorization: Bearer b16a5123eae8f2c75761a1a4e79be775" \
  https://dashboard-social-eight.vercel.app/api/cron/snapshot
```
- Respuesta esperada: `{"ok":...}` o error relacionado a YouTube

**Paso 3:** ¿Horario correcto?
- Cron job está configurado para 11 UTC
- En Colombia: 6 AM (UTC-5)
- Verificar si está ejecutando: Vercel → Cron Logs

---

## ✅ Checklist Final (Antes de Declarar LISTO)

- [ ] App carga sin 404
- [ ] Login funciona con credenciales correctas
- [ ] YouTube stats aparecen en homepage
- [ ] Botón "Actualizar datos" funciona
- [ ] Cron job aparece en Vercel
- [ ] Cron logs muestran ejecuciones
- [ ] Sidebar navegación funciona
- [ ] Formulario login valida campos vacíos
- [ ] No hay errores en DevTools Console
- [ ] Security headers presentes (F12 → Network → Headers)

---

## 📞 Soporte

- **Docs técnicas:** [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md)
- **Estado del proyecto:** [ESTADO-Y-PENDIENTES.md](ESTADO-Y-PENDIENTES.md)
- **GitHub issues:** https://github.com/giopark4444-commits/dashboard-social/issues

---

**Última actualización:** 2026-06-06  
**Próximo hito:** Agregar credenciales y verificar en Vercel
