import { describe, it, expect } from "vitest";
import { DEMO_HOOKS, DEMO_TRENDS, DEMO_CALENDAR, DEMO_SLIDES, DEMO_VIDEO } from "@/lib/demo-data";

describe("demo-data", () => {
  it("hooks con ids únicos y tags", () => {
    expect(DEMO_HOOKS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(DEMO_HOOKS.map((h) => h.id)).size).toBe(DEMO_HOOKS.length);
    expect(DEMO_HOOKS.every((h) => h.tags.length > 0)).toBe(true);
  });

  it("trends con score 0-100", () => {
    expect(DEMO_TRENDS.every((t) => t.score >= 0 && t.score <= 100)).toBe(true);
  });

  it("calendario con días válidos y estados conocidos", () => {
    const estados = ["idea", "borrador", "aprobado", "publicado"];
    expect(DEMO_CALENDAR.every((c) => c.day >= 1 && c.day <= 28)).toBe(true);
    expect(DEMO_CALENDAR.every((c) => estados.includes(c.estado))).toBe(true);
  });

  it("carrusel y video no vacíos", () => {
    expect(DEMO_SLIDES.length).toBeGreaterThanOrEqual(4);
    expect(DEMO_VIDEO.segments.length).toBeGreaterThanOrEqual(3);
  });
});
