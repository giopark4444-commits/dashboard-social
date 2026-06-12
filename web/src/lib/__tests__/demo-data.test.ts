import { describe, it, expect } from "vitest";
import { DEMO_HOOKS, DEMO_TRENDS, DEMO_CALENDAR, DEMO_SLIDES, DEMO_VIDEO, DEMO_BRIEF, DEMO_INBOX, DEMO_PROSPECTS, DEMO_DEALS, DEMO_AUDITS } from "@/lib/demo-data";

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

  it("brief con máximo 3 acciones", () => {
    expect(DEMO_BRIEF.acciones.length).toBeLessThanOrEqual(3);
    expect(DEMO_BRIEF.alertas.length).toBeGreaterThan(0);
  });

  it("inbox con canales y estados válidos", () => {
    expect(DEMO_INBOX.length).toBeGreaterThanOrEqual(5);
    expect(DEMO_INBOX.every((i) => ["IG", "YT", "WA"].includes(i.canal))).toBe(true);
    expect(DEMO_INBOX.every((i) => ["pendiente", "respondido"].includes(i.estado))).toBe(true);
  });

  it("prospects con etapas válidas e ids únicos", () => {
    const etapas = ["nuevo", "contactado", "interesado", "cliente"];
    expect(DEMO_PROSPECTS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(DEMO_PROSPECTS.map((p) => p.id)).size).toBe(DEMO_PROSPECTS.length);
    expect(DEMO_PROSPECTS.every((p) => etapas.includes(p.etapa))).toBe(true);
  });

  it("deals con etapas del pipeline y valor positivo", () => {
    const etapas = ["lead", "contactado", "demo", "cierre"];
    expect(DEMO_DEALS.every((d) => etapas.includes(d.etapa) && d.valor > 0)).toBe(true);
  });

  it("audits con hallazgos priorizados", () => {
    expect(DEMO_AUDITS.length).toBeGreaterThanOrEqual(2);
    expect(DEMO_AUDITS.every((a) => a.hallazgos.length > 0 && a.score >= 0 && a.score <= 100)).toBe(true);
  });
});
