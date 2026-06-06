# 🚀 Preparación para Deploy a Vercel — Dashboard Social

**Estado:** Fase 1 código 100% completo, listo para producción  
**Cron:** Configurado en `vercel.json`  
**Build:** Limpio (`npx next build` pasado)  
**Tests:** 5/5 pasando (`npm test`)

---

## ✅ Checklist Pre-Deploy

- [x] Código en rama `fase-1` (14 commits, revisión completada)
- [x] Tests pasando (`npm test` → 5/5)
- [x] Build sin errores (`npx next build` limpio)
- [x] `.env.local` gitignoreado (verificado en historial)
- [x] `vercel.json` con cron job configurado
- [x] `next.config.ts` configurado para Vercel (defaults)
- [x] README del proyecto documentado (en construcción)
- [ ] **Credenciales en `.env.local`** (pendiente: Supabase service role, YouTube API, Channel ID)
- [ ] Usuario creado en Supabase (`gio.park.4444@gmail.com`)
- [ ] Rama `fase-1` pusheada a GitHub (✅ verificado: `origin/fase-1`)

---

## 📋 Variables de Entorno para Vercel

Copiar las **7 variables** desde `web/.env.example` a **Settings → Environment Variables** en Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://dhjkrrokvovlxmiuihxm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key>
ALLOWED_EMAIL=gio.park.4444@gmail.com
YOUTUBE_API_KEY=<tu_api_key>
YOUTUBE_CHANNEL_ID=<tu_channel_id>
CRON_SECRET=b16a5123eae8f2c75761a1a4e79be775
```

**Notas:**
- `NEXT_PUBLIC_*` se inyectan en el cliente (OK exponer URL)
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor (secret)
- `CRON_SECRET` protege `/api/cron/snapshot` de llamadas no autorizadas

---

## 🔧 Configuración de Cron Job

**Archivo:** `web/vercel.json`
```json
{
  "crons": [{ "path": "/api/cron/snapshot", "schedule": "0 11 * * *" }]
}
```

**Explicación:**
- `path`: ruta del endpoint (debe retornar `200`)
- `schedule`: cron expression POSIX
  - `0 11 * * *` = 11:00 UTC diarios = **6:00 AM Colombia** (UTC-5)
  - Ajustar si cambias zona horaria

**Verificación en Vercel:**
1. Deploy completo
2. Ir a **Settings → Cron Jobs**
3. Ver `/api/cron/snapshot` listado como "next scheduled in X"

---

## 📤 Pasos para Deploy en Vercel

### 1. Crear proyecto en Vercel (una vez)

```bash
# Opción A: Desde CLI (si tienes vercel instalado)
vercel link

# Opción B: Desde dashboard (recomendado)
# https://vercel.com/dashboard → "Add New" → "Project"
```

### 2. Importar repositorio GitHub

1. Ir a https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Seleccionar repo `giopark4444-commits/dashboard-social`
4. Click "Import"

### 3. Configurar Build & Deploy

En el formulario de Vercel:

| Campo | Valor |
|---|---|
| **Framework** | Next.js (auto-detectado) |
| **Root Directory** | ⚠️ **`web`** (importante) |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `.next` (default) |
| **Install Command** | `npm ci` (default) |

### 4. Cargar Environment Variables

En **Settings → Environment Variables**, agregar las 7 variables de arriba:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY` (service role, ⚠️ secret)
4. `ALLOWED_EMAIL`
5. `YOUTUBE_API_KEY` (⚠️ secret)
6. `YOUTUBE_CHANNEL_ID`
7. `CRON_SECRET` (⚠️ secret)

**Para secrets:** después de pegar el valor, seleccionar el checkbox "Sensitive" para que no aparezca en logs.

### 5. Deploy

Click "Deploy" → esperar ~2-3 min (Vercel compila, verifica, pushea)

---

## ✔️ Verificaciones Post-Deploy

Después del deploy (URL será algo como `https://dashboard-social-[hash].vercel.app`):

### 1. ¿App se carga?
```bash
curl https://dashboard-social-[hash].vercel.app
# Debe retornar 307 (redirect a /login)
```

### 2. ¿Login funciona?
1. Abrir URL en navegador
2. Debería redirigir a `/login`
3. Intentar login con `gio.park.4444@gmail.com` + contraseña (creada en Supabase)

### 3. ¿Cron está registrado?
1. Vercel dashboard → Settings → **Cron Jobs**
2. Ver `/api/cron/snapshot` listado
3. Timestamp "Next scheduled" debe mostrar próxima ejecución

### 4. ¿Credenciales cargadas?
Hacer GET a `/api/cron/snapshot` con header `Authorization: Bearer [CRON_SECRET]`:

```bash
curl -H "Authorization: Bearer b16a5123eae8f2c75761a1a4e79be775" \
  https://dashboard-social-[hash].vercel.app/api/cron/snapshot

# Si todo bien: {"ok":["youtube"],"failed":[]}
# Si credenciales falsas: {"ok":[],"failed":["youtube"]}
```

---

## 🔐 Seguridad: Checklist

- [x] `.env.local` en `.gitignore` (verificado)
- [x] Proxy de auth en `src/proxy.ts` (solo `gio.park.4444@gmail.com`)
- [x] Service role key **nunca** en cliente (solo en `/api`)
- [x] Cron protegido por `CRON_SECRET` (header `Authorization`)
- [x] RLS en tabla `snapshots` (solo authenticated puede leer; writes solo service role)
- [ ] **IMPORTANTE:** Después del deploy, cambiar contraseña temporal de Supabase si fue generada por sistema

---

## 📞 Solución de Problemas

### Build falla en Vercel pero funciona local

**Causa:** variables de entorno no cargadas.  
**Fix:** Ir a **Settings → Environment Variables** y verificar que todas las 7 estén presentes (incluyendo secrets).

### Cron no aparece en Settings → Cron Jobs

**Causa:** `vercel.json` no está en root del proyecto o sintaxis incorrecta.  
**Fix:** Verificar que `web/vercel.json` existe y tiene la estructura:
```json
{"crons": [{"path": "/api/cron/snapshot", "schedule": "0 11 * * *"}]}
```

### Login falla con error de Supabase

**Causa:** `SUPABASE_SERVICE_ROLE_KEY` no está en variables de entorno.  
**Fix:** Ir a Supabase → Project Settings → API Keys → copiar "service_role" key y pegar en Vercel.

### `/api/cron/snapshot` retorna 401

**Causa:** `CRON_SECRET` no coincide o no está en header.  
**Comportamiento esperado:** Vercel envía header `Authorization: Bearer [token]` automáticamente.  
**Verificación:** Ver logs de Vercel → Deployments → Cron Logs.

---

## 📝 Próximos Pasos

1. ✅ Obtener 3 credenciales (Supabase service role, YouTube API, Channel ID)
2. ✅ Crear usuario en Supabase
3. ✅ Ejecutar este deploy
4. ✅ Verificar post-deploy
5. ✅ Merge `fase-1` → `main`
6. ❌ Fase 2: Telegram API (esperar instrucciones de diseño)

---

**Documento creado:** 2026-06-06  
**Fase 1:** Código completo, listo para producción  
**Bloqueador:** Credenciales de Gio (15 min para obtener)
