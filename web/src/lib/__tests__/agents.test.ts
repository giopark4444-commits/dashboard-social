import { describe, it, expect } from "vitest";
import { AGENTS, mergeAgentSettings, type AgentSettingRow } from "@/lib/agents";

describe("mergeAgentSettings", () => {
  it("combina catálogo con filas de settings, default manual", () => {
    const rows: AgentSettingRow[] = [
      { agent_id: "cmo", brand_id: "personal", autonomy: "auto" },
    ];
    const merged = mergeAgentSettings(rows);
    expect(merged).toHaveLength(AGENTS.length);
    expect(merged.find((a) => a.id === "cmo")!.autonomy).toBe("auto");
    expect(merged.find((a) => a.id === "trend-scout")!.autonomy).toBe("manual");
  });

  it("ignora filas de agentes que ya no existen en el catálogo", () => {
    const merged = mergeAgentSettings([
      { agent_id: "fantasma", brand_id: "personal", autonomy: "auto" },
    ]);
    expect(merged.every((a) => a.autonomy === "manual")).toBe(true);
  });
});
