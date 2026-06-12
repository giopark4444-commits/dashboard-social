import { describe, it, expect } from "vitest";
import { wrapText } from "@/lib/wrap-text";

// measure = nº de caracteres (1 char = 1 unidad de ancho)
const byChars = (s: string) => s.length;

describe("wrapText", () => {
  it("no parte si cabe", () => {
    expect(wrapText("hola mundo", 20, byChars)).toEqual(["hola mundo"]);
  });

  it("parte por palabras al exceder el ancho", () => {
    expect(wrapText("uno dos tres cuatro", 8, byChars)).toEqual(["uno dos", "tres", "cuatro"]);
  });

  it("respeta saltos de línea explícitos", () => {
    expect(wrapText("uno\n\ndos tres", 20, byChars)).toEqual(["uno", "", "dos tres"]);
  });

  it("una palabra más larga que el ancho queda sola en su línea", () => {
    expect(wrapText("supercalifragilistico ok", 10, byChars)).toEqual(["supercalifragilistico", "ok"]);
  });
});
