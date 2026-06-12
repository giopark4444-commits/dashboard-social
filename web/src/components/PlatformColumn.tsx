import Sparkline from "./Sparkline";
import type { Deltas } from "@/lib/snapshots";

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n >= 10_000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString("es-CO");
}

export function PlatformColumn({ name, icon, unit, deltas }:
  { name: string; icon: string; unit: string; deltas: Deltas }) {
  const d = deltas.vsYesterday;
  return (
    <div className="flex-1 bg-surface border border-border rounded-xl p-4">
      <div className="font-bold text-bright border-b border-border pb-2 mb-2">
        <span className="text-accent">{icon}</span> {name}
      </div>
      <div className="text-2xl font-extrabold text-bright">
        {fmt(deltas.current)}{" "}
        {d !== null && (
          <span className={`text-xs ${d >= 0 ? "text-ok" : "text-red-400"}`}>
            {d >= 0 ? "▲" : "▼"}{Math.abs(d)}
          </span>
        )}
      </div>
      <div className="text-xs text-dim mb-2">{unit} · vs ayer</div>
      <Sparkline values={deltas.spark} />
      {deltas.vsWeek !== null && (
        <div className="text-xs text-muted mt-1">
          7 días: {deltas.vsWeek >= 0 ? "+" : ""}{deltas.vsWeek}
        </div>
      )}
    </div>
  );
}

export function DemoColumn({ name, icon, note }:
  { name: string; icon: string; note: string }) {
  return (
    <div className="flex-1 bg-surface/50 border border-dashed border-border rounded-xl p-4">
      <div className="font-bold text-muted border-b border-border pb-2 mb-2 flex items-center gap-2">
        <span>{icon} {name}</span>
        <span className="ml-auto text-[9px] border border-warn/50 text-warn rounded px-1.5 py-0.5">DEMO</span>
      </div>
      <div className="text-2xl font-extrabold text-dim">—</div>
      <div className="text-xs text-dim mb-2">{note}</div>
    </div>
  );
}
