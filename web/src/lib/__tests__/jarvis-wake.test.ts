import { describe, it, expect } from "vitest";
import { extractCommand } from "@/lib/jarvis-wake";

describe("extractCommand", () => {
  it("sin palabra de activación ⇒ null", () => {
    expect(extractCommand("qué clima hace hoy")).toBeNull();
  });

  it("extrae la orden tras «Jarvis»", () => {
    expect(extractCommand("Jarvis, dame el brief de hoy")).toBe("dame el brief de hoy");
  });

  it("tolera mayúsculas, tildes y texto antes", () => {
    expect(extractCommand("oye JÁRVIS muéstrame las ventas")).toBe("muéstrame las ventas");
  });

  it("solo «Jarvis» ⇒ orden vacía (no null)", () => {
    expect(extractCommand("jarvis")).toBe("");
    expect(extractCommand("Jarvis?")).toBe("");
  });

  it("usa la última invocación si aparece varias veces", () => {
    expect(extractCommand("jarvis no... jarvis exporta el carrusel")).toBe("exporta el carrusel");
  });
});
