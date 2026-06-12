import { describe, it, expect } from "vitest";
import { BRANDS, DEFAULT_BRAND_ID, resolveBrandId, getBrand } from "@/lib/brands";

describe("brands", () => {
  it("tiene las 5 marcas con ids únicos", () => {
    expect(BRANDS).toHaveLength(5);
    expect(new Set(BRANDS.map((b) => b.id)).size).toBe(5);
  });

  it("resolveBrandId valida slugs y cae a personal", () => {
    expect(resolveBrandId("vendalo")).toBe("vendalo");
    expect(resolveBrandId("hacker")).toBe(DEFAULT_BRAND_ID);
    expect(resolveBrandId(undefined)).toBe(DEFAULT_BRAND_ID);
    expect(resolveBrandId(null)).toBe(DEFAULT_BRAND_ID);
  });

  it("getBrand devuelve la marca o personal", () => {
    expect(getBrand("oriole").name).toBe("Oriole 1060");
    expect(getBrand("nope").id).toBe(DEFAULT_BRAND_ID);
  });
});
