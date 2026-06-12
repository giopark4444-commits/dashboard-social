const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Extrae la orden dicha después de la palabra de activación «Jarvis».
 * Devuelve null si no se invocó a Jarvis; "" si solo dijo «Jarvis».
 */
export function extractCommand(transcript: string): string | null {
  const norm = normalize(transcript);
  const idx = norm.lastIndexOf("jarvis");
  if (idx === -1) return null;
  return transcript
    .slice(idx + "jarvis".length)
    .replace(/^[\s,.;:!?¡¿]+/, "")
    .trim();
}
