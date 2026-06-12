import { describe, it, expect } from "vitest";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/nav";

describe("nav", () => {
  it("slugs únicos", () => {
    const slugs = NAV_ITEMS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("todo item pertenece a un grupo declarado", () => {
    const groups = NAV_GROUPS.map((g) => g.id);
    expect(NAV_ITEMS.every((i) => groups.includes(i.group))).toBe(true);
  });

  it("dashboard es la raíz y agentes existe", () => {
    expect(NAV_ITEMS.find((i) => i.slug === "")!.label).toBe("Dashboard");
    expect(NAV_ITEMS.some((i) => i.slug === "agentes")).toBe(true);
  });
});
