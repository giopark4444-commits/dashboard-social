# 📖 Guía de Uso — Dashboard Social

**Última actualización:** 2026-06-06  
**Versión:** Fase 1 (MVP)  
**Audiencia:** Usuario final (Gio)

---

## 🚀 Inicio Rápido

### Acceso a la app

**URL de producción:** `https://dashboard-social-eight.vercel.app`

### Login

1. Navega a la URL
2. Ingresa tu email: `gio.park.4444@gmail.com`
3. Ingresa tu contraseña (la que creaste en Supabase)
4. Click **"Entrar"**

Si ves error "Credenciales incorrectas":
- Verifica que el usuario esté creado en Supabase
- Verifica que esté marcado como "Auto Confirm User"

---

## 📱 Interfaz Principal

### Estructura

```
┌─────────────────────────────────┐
│ Dashboard Social (logo/nombre)  │
├─────────────────────────────────┤
│ SIDEBAR        │   CONTENIDO     │
│                │                 │
│ 🏠 Inicio      │ Columnas lado   │
│ 🗂 Posts       │ a lado:         │
│ 📈 Constancia  │ • Instagram     │
│ 💡 Ideas IA    │ • TikTok        │
│ 💬 Asistente   │ • YouTube       │
│ 🧠 Mi aud.     │ • X (Twitter)   │
│ 🎙 Mi voz      │                 │
│ 🎬 Próximos    │ Accesos rápidos │
│ 📅 Calendario  │ (WhatsApp, etc) │
│ 📊 Tendencias  │                 │
│ 👥 Referentes  │                 │
│ 🤝 Campañas    │                 │
│ ✈️ Telegram    │                 │
│ 🎮 Discord     │                 │
│                │                 │
│ ⚙️ Ajustes     │                 │
└─────────────────────────────────┘
```

### Sidebar

**Botones disponibles:**

| Icono | Nombre | Estado | Próxima Fase |
|-------|--------|--------|--------------|
| 🏠 | Inicio | ✅ Funcional | — |
| 🗂 | Posts | 🔜 Próximamente Fase X | 2+ |
| 📈 | Constancia | 🔜 Próximamente Fase X | 6 |
| 💡 | Ideas IA | 🔜 Próximamente Fase X | 7 |
| 💬 | Asistente | 🔜 Próximamente Fase X | 7 |
| 🧠 | Mi audiencia | 🔜 Próximamente Fase X | 7 |
| 🎙 | Mi voz | 🔜 Próximamente Fase X | 7 |
| 🎬 | Próximos | 🔜 Próximamente Fase X | 8 |
| 📅 | Calendario | 🔜 Próximamente Fase X | 8 |
| 📊 | Tendencias | 🔜 Próximamente Fase X | 8 |
| 👥 | Referentes | 🔜 Próximamente Fase X | 8 |
| 🤝 | Campañas | 🔜 Próximamente Fase X | 8 |
| ✈️ | Telegram | 🔜 Próximamente Fase X | 2 |
| 🎮 | Discord | 🔜 Próximamente Fase X | 3 |
| ⚙️ | Ajustes | 🔜 Próximamente Fase X | — |

**Nota:** El botón "/" colapsa/expande el sidebar para modo compacto.

---

## 🏠 Página Inicio

### Contenido Actual

**Tres columnas lado a lado:**

#### 1. Instagram (Placeholder)
- Actualmente muestra "Próximamente — Fase 4"
- Se completará cuando Meta for Developers esté configurado

#### 2. TikTok (Placeholder)
- Actualmente muestra "Próximamente — Fase 5"
- Requiere aprobación de TikTok Developer (días)

#### 3. YouTube (Funcional ✅)
- Muestra estadísticas en tiempo real de tu canal
- Datos actualizados diariamente a las 6:00 AM (Colombia)
- Puedes hacer refresh manual con el botón "● Actualizar datos"

#### 4. X/Twitter (Enlace directo)
- Link al perfil de X en nueva pestaña

### Accesos Rápidos

Botones para acceder directamente a plataformas:
- 📱 WhatsApp
- 𝕏 X/Twitter
- 💬 Discord

---

## 🔄 Actualización de Datos

### Actualización Automática (Cron)

**Horario:** 6:00 AM hora de Colombia (11:00 UTC)  
**Frecuencia:** Una vez por día  
**Qué se actualiza:** Estadísticas de YouTube (seguidores, vistas, etc.)

### Actualización Manual

Click en el botón **"● Actualizar datos"** para:
- Refrescar datos inmediatamente
- Útil para probar o forzar actualización antes del cron diario

---

## ⚙️ Ajustes (Próxima Fase)

Actualmente vacío. Próximamente incluirá:
- Cambio de contraseña
- Notificaciones
- Preferencias de idioma
- Exportar datos

---

## 🔐 Seguridad & Privacidad

### Autenticación

- ✅ Login con email + contraseña
- ✅ Session management via Supabase
- ✅ Solo tú (gio.park.4444@gmail.com) puedes acceder

### Datos

- ✅ Almacenados en Supabase (encriptados en tránsito)
- ✅ RLS (Row Level Security) activa
- ✅ Solo tu usuario puede ver tus datos

### Credenciales

- ✅ API keys de YouTube/Telegram/Discord almacenadas seguro
- ✅ No se muestran en la interfaz

---

## 🆘 Solución de Problemas

### "Credenciales incorrectas" en login

**Causas posibles:**
1. Usuario no creado en Supabase
2. Contraseña incorrecta
3. Usuario no está "Auto Confirm"

**Solución:**
- Ve a Supabase dashboard → Authentication → Users
- Crea el usuario o reestablece contraseña

### Datos de YouTube no se actualizan

**Causas posibles:**
1. YouTube API key no configurada o inválida
2. Channel ID incorrecto
3. Error en el cron job

**Solución:**
- Verifica en Vercel: Settings → Environment Variables
- Confirma que `YOUTUBE_API_KEY` y `YOUTUBE_CHANNEL_ID` sean correctos
- Click "Actualizar datos" para test manual

### Página muestra "NOT_FOUND"

**Causa:** Vercel no está sirviendo la app correctamente

**Solución:**
- Ve a Vercel → Settings → Build and Deployment
- Verifica: Root Directory = `web`, Output Directory = `.next`
- Redeploy desde Deployments

### Sidebar no aparece

**Causa:** Probable error de JavaScript

**Solución:**
- Abre Console (F12) y revisa errores
- Limpia cache del navegador (Cmd+Shift+R)
- Reinicia navegador

---

## 📊 Datos Mostrados (YouTube)

### Métricas Actuales

- **Seguidores:** Total de suscriptores del canal
- **Vistas:** Total de vistas de todos los videos
- **Videos:** Cantidad de videos publicados
- **Gráfico Sparkline:** Histórico de seguidores (últimos 7 días)

### Métrica Delta (Cambios)

- **Versus Ayer:** Comparación con el día anterior
- **Versus Semana:** Comparación con hace 7 días

---

## 📞 Soporte & Contacto

Para reportar bugs o sugerir features:
- Crear issue en GitHub: https://github.com/giopark4444-commits/dashboard-social
- Email: gio.park.4444@gmail.com

---

## 📌 Notas Importantes

1. **Fase 1 es MVP:** Solo YouTube está completamente funcional
2. **Próximas fases:** Se agregarán Telegram, Discord, Instagram, TikTok
3. **Datos en tiempo real:** YouTube obtiene datos públicos del canal
4. **Sin OAuth todavía:** Las vistas detalladas requieren OAuth (fase futura)

---

**¿Preguntas?** Revisa [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md) para info técnica, o [ESTADO-Y-PENDIENTES.md](ESTADO-Y-PENDIENTES.md) para qué queda por hacer.
