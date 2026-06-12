// Datos de ejemplo para las UIs en modo DEMO (la IA y las APIs llegan en la fase final).

export type DemoHook = { id: number; text: string; tags: string[]; score: number; fuente: string };
export const DEMO_HOOKS: DemoHook[] = [
  { id: 1, text: "Nadie te dice esto antes de abrir un negocio en Colombia…", tags: ["negocio", "curiosidad"], score: 92, fuente: "visto en Reels" },
  { id: 2, text: "Pagué 4 millones al mes en software hasta que hice esto", tags: ["negocio", "dolor"], score: 88, fuente: "propio" },
  { id: 3, text: "3 errores que matan tu bar antes del primer año", tags: ["bar", "lista"], score: 85, fuente: "propio" },
  { id: 4, text: "Esto me costó 2 años aprenderlo (te lo cuento en 40 segundos)", tags: ["historia", "curiosidad"], score: 83, fuente: "visto en TikTok" },
  { id: 5, text: "El truco del inventario que usan los restaurantes grandes", tags: ["bar", "valor"], score: 79, fuente: "propio" },
  { id: 6, text: "¿Por qué tu WhatsApp espanta clientes? (test de 10 segundos)", tags: ["whatsapp", "pregunta"], score: 76, fuente: "visto en Reels" },
  { id: 7, text: "Antes vs después de automatizar mi prospección", tags: ["saas", "antes-despues"], score: 74, fuente: "propio" },
  { id: 8, text: "La métrica que nadie mira y predice si tu contenido pega", tags: ["contenido", "curiosidad"], score: 71, fuente: "visto en YouTube" },
];

export type DemoTrend = { id: number; tema: string; tipo: "tema" | "audio" | "formato" | "hashtag"; score: number; nota: string };
export const DEMO_TRENDS: DemoTrend[] = [
  { id: 1, tema: "POV: emprendiendo en LATAM", tipo: "formato", score: 94, nota: "Formato POV con texto en pantalla, 15-25s. Encaja para Vendalo y marca personal." },
  { id: 2, tema: "audio 'así empezó todo' (remix)", tipo: "audio", score: 87, nota: "Audio en subida los últimos 4 días. Sirve para historia del bar." },
  { id: 3, tema: "#NegociosReales", tipo: "hashtag", score: 81, nota: "Hashtag con tracción en Colombia esta semana." },
  { id: 4, tema: "Day in the life: dueño de bar", tipo: "tema", score: 78, nota: "Vlogs cortos de operación real funcionan para 1060 Bar." },
  { id: 5, tema: "Carruseles 'esto vs esto'", tipo: "formato", score: 73, nota: "Comparativas visuales simples, alto save-rate." },
  { id: 6, tema: "IA para pymes (escepticismo)", tipo: "tema", score: 69, nota: "Ángulo contraintuitivo: 'la IA no te va a salvar si…'" },
];

export type DemoCalItem = { id: number; day: number; titulo: string; canal: string; estado: "idea" | "borrador" | "aprobado" | "publicado" };
export const DEMO_CALENDAR: DemoCalItem[] = [
  { id: 1, day: 2, titulo: "Reel: 3 errores de bar", canal: "IG", estado: "publicado" },
  { id: 2, day: 4, titulo: "Carrusel: Siigo vs tu app", canal: "IG", estado: "publicado" },
  { id: 3, day: 8, titulo: "Short: inventario en 60s", canal: "YT", estado: "aprobado" },
  { id: 4, day: 11, titulo: "Reel: POV emprendiendo", canal: "IG", estado: "borrador" },
  { id: 5, day: 15, titulo: "Video: tour del 1060", canal: "YT", estado: "borrador" },
  { id: 6, day: 18, titulo: "Carrusel: hooks que venden", canal: "IG", estado: "idea" },
  { id: 7, day: 22, titulo: "Short: demo Vendalo 45s", canal: "YT", estado: "idea" },
  { id: 8, day: 26, titulo: "Reel: antes/después prospección", canal: "IG", estado: "idea" },
];

export type DemoSlide = { id: number; titulo: string; cuerpo: string };
export const DEMO_SLIDES: DemoSlide[] = [
  { id: 1, titulo: "Pagué 4M/mes en software 😤", cuerpo: "Siigo + Soft Restaurant + nómina + …\n\nHasta que hice cuentas." },
  { id: 2, titulo: "El problema no es pagar", cuerpo: "Es pagar por 10 herramientas que no se hablan entre ellas." },
  { id: 3, titulo: "Qué hice", cuerpo: "Una sola app: POS + inventario + facturación + nómina.\n\nTodo conectado." },
  { id: 4, titulo: "El resultado", cuerpo: "De ~4M/mes a una fracción.\nY cero re-digitación." },
  { id: 5, titulo: "¿Tu negocio paga doble?", cuerpo: "Comenta 'CUENTAS' y te muestro cómo auditarlo en 10 min. →" },
];

export type DemoVideo = {
  titulo: string; duracion: string; hookScore: number;
  segments: { from: string; to: string; etiqueta: string; nota: string; fuerza: "alta" | "media" | "baja" }[];
  recomendaciones: string[];
};
export const DEMO_VIDEO: DemoVideo = {
  titulo: "Demo: 'El truco del inventario' (45s)",
  duracion: "0:45",
  hookScore: 82,
  segments: [
    { from: "0:00", to: "0:04", etiqueta: "Hook", nota: "Pregunta directa + texto en pantalla. Retiene.", fuerza: "alta" },
    { from: "0:04", to: "0:18", etiqueta: "Contexto", nota: "Un poco largo: 14s para llegar al valor.", fuerza: "media" },
    { from: "0:18", to: "0:38", etiqueta: "Valor", nota: "El truco explicado con demo en pantalla. Bien.", fuerza: "alta" },
    { from: "0:38", to: "0:45", etiqueta: "CTA", nota: "CTA suave ('sígueme'). Probar CTA de comentario.", fuerza: "baja" },
  ],
  recomendaciones: [
    "Recorta el contexto a ≤8s: entra al valor antes del segundo 12.",
    "Cambia el CTA a uno de comentario ('escribe INVENTARIO') para alimentar prospección.",
    "El hook funciona — guárdalo como variante en el Hook Bank.",
  ],
};

export type DemoBrief = { resumen: string; alertas: { severidad: "info" | "warn"; texto: string }[]; acciones: string[]; oportunidad: string };
export const DEMO_BRIEF: DemoBrief = {
  resumen: "Semana estable en YouTube con momentum leve. El cuello de botella sigue siendo la frecuencia de publicación: 2 de 4 contenidos planeados salieron.",
  alertas: [
    { severidad: "warn", texto: "Instagram lleva 6 días sin publicar — el calendario tiene 3 piezas en borrador." },
    { severidad: "info", texto: "El Reel del martes superó 2x tu mediana de views en 48h." },
  ],
  acciones: [
    "Publica hoy el carrusel 'Siigo vs tu app' (ya está aprobado en el calendario).",
    "Graba la variante del hook #2 del Hook Bank mientras el tema tiene momentum.",
    "Responde los 3 DMs pendientes del Inbox — dos parecen prospectos calientes.",
  ],
  oportunidad: "El formato 'POV: emprendiendo en LATAM' (Trend Scout, score 94) encaja perfecto con tu historia de dejar Siigo. Guión de 20s: gancho con la factura de 4M → corte a la app propia.",
};

export type DemoInboxItem = { id: number; canal: "IG" | "YT" | "WA"; tipo: "comentario" | "dm" | "mención"; de: string; texto: string; sugerencia: string; estado: "pendiente" | "respondido"; hace: string };
export const DEMO_INBOX: DemoInboxItem[] = [
  { id: 1, canal: "IG", tipo: "dm", de: "@cafetera.bogota", texto: "Hola! Vi tu video del inventario. ¿La app sirve para una cafetería?", sugerencia: "¡Claro! Está pensada para cualquier negocio con inventario. ¿Cuántos puntos de venta tienes? Te muestro cómo quedaría para tu cafetería.", estado: "pendiente", hace: "hace 2 h" },
  { id: 2, canal: "YT", tipo: "comentario", de: "Andrés M.", texto: "¿Esto reemplaza completamente a Siigo? ¿Y la facturación electrónica?", sugerencia: "La facturación electrónica está en el roadmap con proveedor tecnológico DIAN. Hoy cubre POS + inventario + nómina. Te avisamos al lanzarla.", estado: "pendiente", hace: "hace 5 h" },
  { id: 3, canal: "WA", tipo: "dm", de: "+57 301 •• 42", texto: "Buenas, ¿precio para 2 bares?", sugerencia: "¡Hola! Para 2 sedes el plan queda en $X/mes con todo incluido. ¿Te agendo una demo de 15 min esta semana?", estado: "pendiente", hace: "hace 8 h" },
  { id: 4, canal: "IG", tipo: "comentario", de: "@valen_rojas", texto: "El antes y después 🔥🔥", sugerencia: "🙌 ¡Gracias! Si quieres ver cómo quedó por dentro, el video completo está en el canal.", estado: "respondido", hace: "ayer" },
  { id: 5, canal: "IG", tipo: "mención", de: "@emprendecol", texto: "Buen caso de estudio de @giopark sobre dejar el software tradicional", sugerencia: "¡Gracias por compartirlo! 🚀", estado: "respondido", hace: "ayer" },
  { id: 6, canal: "YT", tipo: "comentario", de: "Laura P.", texto: "¿Hay versión de prueba?", sugerencia: "Sí — 14 días gratis sin tarjeta. Link en la descripción. Cualquier duda me escribes.", estado: "pendiente", hace: "hace 2 días" },
];

export type DemoProspect = { id: number; nombre: string; handle: string; fuente: string; etapa: "nuevo" | "contactado" | "interesado" | "cliente"; tags: string[] };
export const DEMO_PROSPECTS: DemoProspect[] = [
  { id: 1, nombre: "Cafetera Bogotá", handle: "@cafetera.bogota", fuente: "DM Instagram", etapa: "interesado", tags: ["cafetería", "2 sedes"] },
  { id: 2, nombre: "Andrés Mejía", handle: "youtube", fuente: "Comentario YT", etapa: "nuevo", tags: ["facturación"] },
  { id: 3, nombre: "Bar La Cumbre", handle: "+57 301···", fuente: "WhatsApp", etapa: "interesado", tags: ["bar", "2 sedes"] },
  { id: 4, nombre: "Panadería El Trigal", handle: "@eltrigal.pan", fuente: "DM Instagram", etapa: "contactado", tags: ["panadería"] },
  { id: 5, nombre: "Diana Torres", handle: "@diana.eventos", fuente: "Mención IG", etapa: "nuevo", tags: ["eventos"] },
  { id: 6, nombre: "Ferretería Central", handle: "+57 315···", fuente: "Referido", etapa: "contactado", tags: ["ferretería", "vertical"] },
  { id: 7, nombre: "Café Madrugón", handle: "@madrugon.cafe", fuente: "DM Instagram", etapa: "cliente", tags: ["cafetería"] },
  { id: 8, nombre: "Hostal Nómada", handle: "booking", fuente: "Web", etapa: "nuevo", tags: ["hospedaje"] },
  { id: 9, nombre: "Parqueadero 93", handle: "+57 310···", fuente: "Referido", etapa: "nuevo", tags: ["parqueadero", "vertical"] },
  { id: 10, nombre: "Restaurante Doña Ana", handle: "@dona.ana", fuente: "Comentario IG", etapa: "contactado", tags: ["restaurante"] },
];

export type DemoDeal = { id: number; nombre: string; valor: number; etapa: "lead" | "contactado" | "demo" | "cierre"; nota: string };
export const DEMO_DEALS: DemoDeal[] = [
  { id: 1, nombre: "Bar La Cumbre (2 sedes)", valor: 380_000, etapa: "demo", nota: "Demo agendada jueves 7pm" },
  { id: 2, nombre: "Cafetera Bogotá", valor: 190_000, etapa: "contactado", nota: "Pidió precios por DM" },
  { id: 3, nombre: "Panadería El Trigal", valor: 190_000, etapa: "contactado", nota: "Respondió interesada, falta llamada" },
  { id: 4, nombre: "Ferretería Central", valor: 250_000, etapa: "lead", nota: "Referido de Café Madrugón" },
  { id: 5, nombre: "Restaurante Doña Ana", valor: 190_000, etapa: "lead", nota: "Comentó en el Reel del POS" },
  { id: 6, nombre: "Café Madrugón", valor: 190_000, etapa: "cierre", nota: "✓ Cliente desde mayo — referencia activa" },
];

export type DemoAudit = { id: number; canal: string; fecha: string; score: number; resumen: string; hallazgos: { prioridad: "alta" | "media" | "baja"; texto: string }[]; acciones: string[] };
export const DEMO_AUDITS: DemoAudit[] = [
  {
    id: 1, canal: "Instagram", fecha: "2026-06-10", score: 64,
    resumen: "Perfil sólido pero subutilizado: buen contenido, frecuencia irregular y bio sin CTA claro.",
    hallazgos: [
      { prioridad: "alta", texto: "La bio no dice qué haces ni tiene CTA — los visitantes no saben qué hacer después de un Reel viral." },
      { prioridad: "alta", texto: "Frecuencia irregular: 8 días sin publicar después de tu mejor semana." },
      { prioridad: "media", texto: "Los carruseles tienen 3x el save-rate de los Reels pero son solo el 15% del contenido." },
      { prioridad: "baja", texto: "Historias sin destacados organizados por tema." },
    ],
    acciones: ["Reescribe la bio: qué haces + para quién + CTA al link.", "Calendario mínimo viable: 3 piezas/semana, ya cargadas en el Content Calendar.", "Sube la cuota de carruseles al 40% del mix."],
  },
  {
    id: 2, canal: "YouTube", fecha: "2026-06-03", score: 71,
    resumen: "Canal con buena retención pero pocos puntos de entrada: faltan títulos buscables.",
    hallazgos: [
      { prioridad: "alta", texto: "Títulos cuentan la historia pero nadie los busca — cero tráfico de búsqueda." },
      { prioridad: "media", texto: "Sin pantallas finales enlazando al siguiente video: se pierde sesión." },
    ],
    acciones: ["Reformula títulos con la fórmula problema+especificidad.", "Agrega pantallas finales a los últimos 5 videos."],
  },
];
