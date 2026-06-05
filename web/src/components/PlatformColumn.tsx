import Sparkline from "./Sparkline";
import type { Deltas } from "@/lib/snapshots";

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n >= 10_000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString("es-CO");
}

export function PlatformColumn({ name, emoji, unit, deltas }:
  { name: string; emoji: string; unit: string; deltas: Deltas }) {
  const d = deltas.vsYesterday;
  return (
    <div className="flex-1 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
      <div className="font-bold border-b border-stone-100 pb-2 mb-2">{emoji} {name}</div>
      <div className="text-2xl font-extrabold">
        {fmt(deltas.current)}{" "}
        {d !== null && (
          <span className={`text-xs ${d >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {d >= 0 ? "▲" : "▼"}{Math.abs(d)}
          </span>
        )}
      </div>
      <div className="text-xs text-stone-400 mb-2">{unit} · vs ayer</div>
      <Sparkline values={deltas.spark} />
      {deltas.vsWeek !== null && (
        <div className="text-xs text-stone-500 mt-1">7 días: {deltas.vsWeek >= 0 ? "+" : ""}{deltas.vsWeek}</div>
      )}
    </div>
  );
}

export function PlaceholderColumn({ name, emoji, note, href }:
  { name: string; emoji: string; note: string; href?: string }) {
  return (
    <div className="flex-1 bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl p-4">
      <div className="font-bold border-b border-stone-200 pb-2 mb-2 text-stone-500">{emoji} {name}</div>
      <div className="text-2xl font-extrabold text-stone-300">—</div>
      <div className="text-xs text-stone-400 mb-2">{note}</div>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="block text-center text-xs bg-stone-200 hover:bg-stone-300 rounded-lg py-1.5 text-stone-600">
          abrir ↗
        </a>
      )}
    </div>
  );
}
