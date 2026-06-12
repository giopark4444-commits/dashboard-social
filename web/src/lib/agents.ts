export type Autonomy = "manual" | "copiloto" | "auto";
export const AUTONOMY_LEVELS: Autonomy[] = ["manual", "copiloto", "auto"];

export type AgentDef = { id: string; name: string; module: string; desc: string };

// Catálogo estático; la autonomía por marca vive en public.agent_settings
export const AGENTS: AgentDef[] = [
  { id: "cmo",            name: "CMO Agent",      module: "Centro",       desc: "Cerebro: Daily Brief, chat y coordinación (Fase 2)" },
  { id: "hook-hunter",    name: "Hook Hunter",    module: "Contenido",    desc: "Variantes y clasificación de hooks (Fase 4)" },
  { id: "carrusel-writer",name: "Carrusel Writer",module: "Contenido",    desc: "Escribe slides de carruseles (Fase 4)" },
  { id: "trend-scout",    name: "Trend Scout",    module: "Contenido",    desc: "Rastreo de tendencias en el runner (Fase 5)" },
  { id: "prospector",     name: "Prospector",     module: "Crecimiento",  desc: "Enriquecimiento de prospects (Fase 6)" },
  { id: "auditor",        name: "Auditor",        module: "Inteligencia", desc: "Auditorías de canal completas (Fase 7)" },
];

export type AgentSettingRow = { agent_id: string; brand_id: string; autonomy: Autonomy };
export type AgentWithSettings = AgentDef & { autonomy: Autonomy };

/** Catálogo + settings de la marca activa; sin fila ⇒ manual. */
export function mergeAgentSettings(rows: AgentSettingRow[]): AgentWithSettings[] {
  return AGENTS.map((a) => ({
    ...a,
    autonomy: rows.find((r) => r.agent_id === a.id)?.autonomy ?? "manual",
  }));
}
