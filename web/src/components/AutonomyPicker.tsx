"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AUTONOMY_LEVELS, type Autonomy } from "@/lib/agents";

const LABELS: Record<Autonomy, string> = {
  manual: "Manual", copiloto: "Copiloto", auto: "Auto",
};

export default function AutonomyPicker({ agentId, brandId, value }:
  { agentId: string; brandId: string; value: Autonomy }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function set(autonomy: Autonomy) {
    if (autonomy === value || saving) return;
    setSaving(true);
    const res = await fetch("/api/agents/autonomy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, brandId, autonomy }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className={`inline-flex border border-border rounded-lg overflow-hidden text-xs ${saving ? "opacity-50" : ""}`}>
      {AUTONOMY_LEVELS.map((level) => (
        <button key={level} onClick={() => set(level)} disabled={saving}
          className={`px-2.5 py-1 ${
            level === value
              ? level === "auto" ? "bg-warn/20 text-warn"
                : level === "copiloto" ? "bg-accent/20 text-accent"
                : "bg-surface-2 text-bright"
              : "text-dim hover:text-muted"}`}>
          {LABELS[level]}
        </button>
      ))}
    </div>
  );
}
