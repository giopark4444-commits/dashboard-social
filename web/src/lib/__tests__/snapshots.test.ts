import { describe, it, expect } from "vitest";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";

function row(date: string, followers: number): SnapshotRow {
  return { platform: "youtube", snapshot_date: date, followers,
           total_views: 1000, posts_count: 10 };
}

describe("computeDeltas", () => {
  it("calcula delta vs ayer y vs hace 7 días", () => {
    const rows = [
      row("2026-06-05", 3205), row("2026-06-04", 3200),
      row("2026-06-03", 3190), row("2026-05-29", 3100),
    ];
    const d = computeDeltas(rows);
    expect(d.current).toBe(3205);
    expect(d.vsYesterday).toBe(5);      // 3205 - 3200
    expect(d.vsWeek).toBe(105);         // 3205 - 3100 (fila más cercana ≥7 días atrás)
    expect(d.spark).toEqual([3100, 3190, 3200, 3205]); // cronológico
  });

  it("devuelve nulls sin datos suficientes", () => {
    const d = computeDeltas([row("2026-06-05", 3205)]);
    expect(d.current).toBe(3205);
    expect(d.vsYesterday).toBeNull();
    expect(d.vsWeek).toBeNull();
  });

  it("devuelve todo null sin filas", () => {
    const d = computeDeltas([]);
    expect(d.current).toBeNull();
    expect(d.spark).toEqual([]);
  });
});
