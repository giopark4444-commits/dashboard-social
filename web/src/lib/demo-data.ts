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
