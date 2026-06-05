export type NavItem = { slug: string; label: string; emoji: string; group: 1 | 2 | 3 };

// group 1 = analítica/contenido · 2 = mensajería · 3 = inferior
export const NAV_ITEMS: NavItem[] = [
  { slug: "", label: "Inicio", emoji: "🏠", group: 1 },
  { slug: "posts", label: "Posts", emoji: "🗂", group: 1 },
  { slug: "constancia", label: "Constancia", emoji: "📈", group: 1 },
  { slug: "ideas", label: "Ideas IA", emoji: "💡", group: 1 },
  { slug: "asistente", label: "Asistente", emoji: "💬", group: 1 },
  { slug: "audiencia", label: "Mi audiencia", emoji: "🧠", group: 1 },
  { slug: "voz", label: "Mi voz", emoji: "🎙", group: 1 },
  { slug: "proximos", label: "Próximos", emoji: "🎬", group: 1 },
  { slug: "calendario", label: "Calendario", emoji: "📅", group: 1 },
  { slug: "tendencias", label: "Tendencias", emoji: "📊", group: 1 },
  { slug: "referentes", label: "Referentes", emoji: "👥", group: 1 },
  { slug: "campanas", label: "Campañas", emoji: "🤝", group: 1 },
  { slug: "telegram", label: "Telegram", emoji: "✈️", group: 2 },
  { slug: "discord", label: "Discord", emoji: "🎮", group: 2 },
  { slug: "ajustes", label: "Ajustes", emoji: "⚙️", group: 3 },
];

export const SECTION_SLUGS = NAV_ITEMS.map((i) => i.slug).filter(Boolean);
