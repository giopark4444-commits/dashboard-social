export type NavGroupId = "centro" | "canales" | "crecimiento" | "contenido" | "inteligencia" | "sistema";
export type NavGroupDef = { id: NavGroupId; label: string };

export const NAV_GROUPS: NavGroupDef[] = [
  { id: "centro",       label: "Centro" },
  { id: "canales",      label: "Canales" },
  { id: "crecimiento",  label: "Crecimiento" },
  { id: "contenido",    label: "Contenido" },
  { id: "inteligencia", label: "Inteligencia" },
  { id: "sistema",      label: "" }, // grupo inferior sin título
];

// phase = fase del spec en la que el módulo cobra vida; sin phase ⇒ vive desde la Fase 1
export type NavItem = { slug: string; label: string; icon: string; group: NavGroupId; phase?: number };

export const NAV_ITEMS: NavItem[] = [
  { slug: "",            label: "Dashboard",        icon: "◈", group: "centro" },
  { slug: "brief",       label: "Daily Brief",      icon: "☀", group: "centro",       phase: 2 },
  { slug: "inbox",       label: "Inbox",            icon: "✉", group: "centro",       phase: 6 },
  { slug: "youtube",     label: "YouTube",          icon: "▶", group: "canales",      phase: 2 },
  { slug: "instagram",   label: "Instagram",        icon: "◎", group: "canales",      phase: 7 },
  { slug: "meta-ads",    label: "Meta Ads",         icon: "▣", group: "canales",      phase: 7 },
  { slug: "whatsapp",    label: "Bot WhatsApp",     icon: "✆", group: "canales",      phase: 5 },
  { slug: "prospeccion", label: "Prospección",      icon: "⌖", group: "crecimiento",  phase: 6 },
  { slug: "ventas",      label: "Ventas",           icon: "↗", group: "crecimiento",  phase: 6 },
  { slug: "calendario",  label: "Content Calendar", icon: "▦", group: "contenido" },
  { slug: "carrusel",    label: "Carrusel Studio",  icon: "❏", group: "contenido" },
  { slug: "hooks",       label: "Hook Bank",        icon: "⚓", group: "contenido" },
  { slug: "trends",      label: "Trend Scout",      icon: "≈", group: "contenido" },
  { slug: "video",       label: "Video Analysis",   icon: "◬", group: "contenido" },
  { slug: "audits",      label: "Audit Inbox",      icon: "✓", group: "inteligencia", phase: 7 },
  { slug: "skills",      label: "Skills Library",   icon: "✦", group: "inteligencia", phase: 2 },
  { slug: "agentes",     label: "Agentes",          icon: "⌬", group: "inteligencia" },
  { slug: "jarvis",      label: "Jarvis HUD",       icon: "◉", group: "inteligencia" },
  { slug: "ajustes",     label: "Ajustes",          icon: "⚙", group: "sistema",      phase: 2 },
];

export const SECTION_SLUGS = NAV_ITEMS.map((i) => i.slug).filter(Boolean);
