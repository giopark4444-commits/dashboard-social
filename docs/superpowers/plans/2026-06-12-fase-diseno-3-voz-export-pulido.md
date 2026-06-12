# Fase Diseño 3 — Voz de Jarvis + Export de Carruseles + Pulido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tres mejoras sin APIs externas ni llaves: (1) hablarle a Jarvis por micrófono y que responda con voz (Web Speech API del navegador) con orbe reactivo al audio real (Web Audio API), (2) exportar los slides del Carrusel Studio como PNG 1080×1350 listos para Instagram (canvas), (3) pulido fino: transiciones, skeleton loader, scrollbars y micro-detalles.

**Architecture:** Todo client-side y gratis. La voz usa `SpeechRecognition`/`webkitSpeechRecognition` (Chrome/Edge/Safari; en Firefox el botón de mic se oculta solo) y `speechSynthesis` para responder; el orbe recibe un `levelRef` (número 0-1 en un ref, sin re-renders) alimentado por un `AnalyserNode` del micrófono mientras escucha y por una onda sintética mientras habla. El export dibuja cada slide en un canvas offscreen y descarga PNGs. Las respuestas de Jarvis siguen siendo demo — el cerebro (API Claude) llega en la fase de APIs.

**Tech Stack:** Next.js 16.2.7, Web Speech API, Web Audio API, Canvas 2D. SIN dependencias nuevas.

**Reglas del repo:** `web/AGENTS.md`; npm desde `web/`; git desde la raíz. Rama: `vantage-diseno-3`. Lint: nada de comillas dobles literales en JSX.

---

### Task 1: Export de carruseles a PNG

**Files:**
- Create: `web/src/lib/wrap-text.ts`
- Test: `web/src/lib/__tests__/wrap-text.test.ts`
- Modify: `web/src/components/CarruselEditor.tsx` (reemplazo completo)

- [ ] **Step 1: Test que falla** — `web/src/lib/__tests__/wrap-text.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr y ver que falla** → `npm test` FAIL.

- [ ] **Step 3: Implementar `web/src/lib/wrap-text.ts`**

```ts
/** Parte texto en líneas que quepan en maxWidth según una función de medida. Puro (testeable sin canvas). */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(" ").filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = words[0];
    for (const word of words.slice(1)) {
      if (measure(line + " " + word) <= maxWidth) line += " " + word;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}
```

- [ ] **Step 4: Correr tests** → PASS.

- [ ] **Step 5: Reemplazar `web/src/components/CarruselEditor.tsx` completo** (igual que antes + botón Exportar):

```tsx
"use client";
import { useState } from "react";
import { DEMO_SLIDES, type DemoSlide } from "@/lib/demo-data";
import { wrapText } from "@/lib/wrap-text";

const W = 1080, H = 1350;
const MONO = "ui-monospace, Menlo, Consolas, monospace";

function renderSlide(slide: DemoSlide, index: number, total: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // fondo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#16213c");
  bg.addColorStop(1, "#0d1426");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, W * 0.7);
  glow.addColorStop(0, "rgba(79,140,255,0.16)");
  glow.addColorStop(1, "rgba(79,140,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const measure = (s: string) => ctx.measureText(s).width;

  // marca
  ctx.fillStyle = "#4f8cff";
  ctx.font = `bold 30px ${MONO}`;
  ctx.fillText("▣ VANTAGE", 80, 110);

  // título
  ctx.fillStyle = "#e8f0ff";
  ctx.font = `bold 76px ${MONO}`;
  let y = 420;
  for (const line of wrapText(slide.titulo, W - 160, measure)) {
    ctx.fillText(line, 80, y);
    y += 92;
  }

  // cuerpo
  y += 30;
  ctx.fillStyle = "#8fa3c8";
  ctx.font = `42px ${MONO}`;
  for (const line of wrapText(slide.cuerpo, W - 160, measure)) {
    ctx.fillText(line, 80, y);
    y += 60;
  }

  // pie
  ctx.fillStyle = "#3d527d";
  ctx.font = `28px ${MONO}`;
  ctx.fillText("@giopark", 80, H - 70);
  const pager = `${index + 1} / ${total} →`;
  ctx.fillText(pager, W - 80 - ctx.measureText(pager).width, H - 70);

  return canvas;
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

export default function CarruselEditor() {
  const [sel, setSel] = useState(0);
  const [exporting, setExporting] = useState(false);
  const slide = DEMO_SLIDES[sel];

  async function exportAll() {
    setExporting(true);
    for (let i = 0; i < DEMO_SLIDES.length; i++) {
      await downloadCanvas(renderSlide(DEMO_SLIDES[i], i, DEMO_SLIDES.length), `carrusel-slide-${i + 1}.png`);
      await new Promise((r) => setTimeout(r, 250)); // respiro entre descargas
    }
    setExporting(false);
  }

  return (
    <div className="flex flex-col md:flex-row gap-5">
      <div className="md:w-64 space-y-2">
        {DEMO_SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setSel(i)}
            className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${i === sel ? "border-accent bg-surface-2 text-bright" : "border-border bg-surface text-muted hover:border-accent/40"}`}>
            <span className="text-[10px] text-dim mr-2">{i + 1}/{DEMO_SLIDES.length}</span>
            {s.titulo}
          </button>
        ))}
        <button onClick={exportAll} disabled={exporting}
          className="w-full text-sm bg-accent/20 border border-accent/50 text-bright rounded-lg px-3 py-2 hover:bg-accent/30 disabled:opacity-50">
          {exporting ? "Exportando…" : "⬇ Exportar PNG (1080×1350)"}
        </button>
        <p className="text-[10px] text-dim pt-1">
          En la fase final: escribes un hook o tema y Carrusel Writer (IA) genera los slides.
        </p>
      </div>

      {/* preview 4:5 */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-sm aspect-[4/5] rounded-2xl border border-border bg-gradient-to-b from-surface-2 to-surface p-8 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #4f8cff, transparent 60%)" }} />
          <div className="text-[10px] tracking-[0.25em] text-accent mb-auto z-10">▣ VANTAGE</div>
          <h2 className="text-2xl font-extrabold text-bright leading-tight mb-4 z-10">{slide.titulo}</h2>
          <p className="text-sm text-muted whitespace-pre-wrap z-10">{slide.cuerpo}</p>
          <div className="mt-auto flex justify-between items-center z-10">
            <span className="text-[10px] text-dim">@giopark</span>
            <span className="text-[10px] text-dim">{sel + 1} / {DEMO_SLIDES.length} →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verificar** → `npm run build && npm test` verdes (26 tests). **Step 7: Commit**

```bash
git add web/src/lib/wrap-text.ts web/src/lib/__tests__/wrap-text.test.ts web/src/components/CarruselEditor.tsx
git commit -m "feat: exportar carrusel como PNGs 1080x1350 desde canvas"
```

---

### Task 2: Pulido fino

**Files:**
- Modify: `web/src/app/globals.css` (agregar al final)
- Create: `web/src/app/loading.tsx`
- Modify: `web/src/components/Sidebar.tsx` (barra de acento en item activo)
- Modify: `web/src/components/PlatformColumn.tsx` (hover en tarjetas)

- [ ] **Step 1: Agregar al FINAL de `globals.css`:**

```css
/* ── pulido ─────────────────────────────────────── */

@keyframes pageIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}
main > * { animation: pageIn 0.25s ease-out; }

::selection { background: rgba(79, 140, 255, 0.35); }

* { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--dim); }

a, button, select, summary {
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 1px solid var(--accent);
  outline-offset: 2px;
}

@keyframes pulseSoft { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
.skeleton { animation: pulseSoft 1.4s ease-in-out infinite; }
```

- [ ] **Step 2: Crear `web/src/app/loading.tsx`** (skeleton command-center mientras cargan las páginas dinámicas):

```tsx
export default function Loading() {
  return (
    <div className="max-w-5xl">
      <div className="skeleton h-3 w-48 bg-surface-2 rounded mb-2" />
      <div className="skeleton h-8 w-72 bg-surface-2 rounded mb-6" />
      <div className="flex gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton flex-1 h-32 bg-surface border border-border rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-40 bg-surface border border-border rounded-xl" />
    </div>
  );
}
```

- [ ] **Step 3: Barra de acento en el Sidebar.** En `Sidebar.tsx`, el `<Link>` de los items: agregar `relative` al inicio de su className y la barrita cuando está activo. Reemplazar el bloque del Link por:

```tsx
                return (
                  <Link key={item.slug} href={href} title={item.label}
                    className={`relative flex items-center rounded-lg py-1.5 mb-0.5 ${
                      collapsed ? "justify-center px-0" : "gap-2 px-3"
                    } ${
                      active ? "bg-surface-2 font-semibold text-bright"
                             : "text-muted hover:bg-surface-2"}`}>
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-accent rounded-full" />}
                    <span className="text-base leading-none shrink-0 text-accent">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.phase && (
                      <span className="ml-auto text-[9px] text-dim">F{item.phase}</span>
                    )}
                  </Link>
                );
```

- [ ] **Step 4: Hover en tarjetas del dashboard.** En `PlatformColumn.tsx`:
  - En `PlatformColumn`, el div raíz pasa de `"flex-1 bg-surface border border-border rounded-xl p-4"` a `"flex-1 bg-surface border border-border rounded-xl p-4 transition-colors hover:border-accent/40"`.
  - En `DemoColumn`, el div raíz pasa de `"flex-1 bg-surface/50 border border-dashed border-border rounded-xl p-4"` a `"flex-1 bg-surface/50 border border-dashed border-border rounded-xl p-4 transition-colors hover:border-warn/40"`.

- [ ] **Step 5: Verificar** → `npm test && npm run lint && npm run build` verdes. **Step 6: Commit**

```bash
git add web/src/app/globals.css web/src/app/loading.tsx web/src/components/Sidebar.tsx web/src/components/PlatformColumn.tsx
git commit -m "feat: pulido — transiciones, skeleton, scrollbars y acentos"
```

---

### Task 3: Voz de Jarvis (Web Speech + orbe reactivo)

**Files:**
- Modify: `web/src/components/JarvisOrb.tsx` (reemplazo completo: acepta `levelRef`)
- Create: `web/src/components/JarvisStage.tsx`
- Delete: `web/src/components/JarvisConsole.tsx` (lo absorbe JarvisStage)
- Modify: `web/src/app/jarvis/page.tsx` (reemplazo completo)

- [ ] **Step 1: Reemplazar `web/src/components/JarvisOrb.tsx` completo** (igual que antes + `levelRef` modula amplitud y brillo):

```tsx
"use client";
import { useEffect, useRef, type RefObject } from "react";

/** Orbe del HUD. `levelRef` (0-1) modula amplitud/brillo en vivo sin re-renders (mic o voz). */
export default function JarvisOrb({ size = 280, levelRef }: { size?: number; levelRef?: RefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2;
    let raf = 0;
    const start = performance.now();

    function draw(now: number) {
      const t = (now - start) / 1000;
      const level = Math.max(0, Math.min(1, levelRef?.current ?? 0));
      ctx.clearRect(0, 0, size, size);

      // halo (más brillante con nivel de audio)
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      halo.addColorStop(0, `rgba(79,140,255,${0.25 + level * 0.25})`);
      halo.addColorStop(0.6, "rgba(79,140,255,0.06)");
      halo.addColorStop(1, "rgba(79,140,255,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // anillos de onda (amplitud modulada por audio)
      const amp = 1 + level * 2.5;
      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
          const wob = Math.sin(a * (5 + ring * 2) + t * (1.2 + ring * 0.5)) * (4 + ring * 2) * amp;
          const r = size * 0.22 + ring * 14 + wob + Math.sin(t * 1.5) * 3;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(79,140,255,${0.45 - ring * 0.13 + level * 0.2})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // núcleo
      const pulse = 1 + Math.sin(t * 2) * 0.06 + level * 0.3;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.16 * pulse);
      core.addColorStop(0, "rgba(232,240,255,0.95)");
      core.addColorStop(0.4, "rgba(79,140,255,0.8)");
      core.addColorStop(1, "rgba(79,140,255,0.05)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.16 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // partículas en órbita
      for (let i = 0; i < 14; i++) {
        const ang = t * (0.3 + (i % 5) * 0.12) + (i * Math.PI * 2) / 14;
        const r = size * 0.34 + Math.sin(t + i) * 8;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.92, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(143,163,200,0.8)";
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, levelRef]);

  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden />;
}
```

- [ ] **Step 2: Crear `web/src/components/JarvisStage.tsx`** (orbe + voz + consola; los readouts llegan como props server-rendered):

```tsx
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import JarvisOrb from "@/components/JarvisOrb";

type Line = { who: "tú" | "jarvis"; text: string };

const DEMO_REPLIES = [
  "Sistemas visuales en línea. El cerebro (API de Claude) se conecta en la fase final — registro tu mensaje.",
  "Anotado. Cuando me conecten el cerebro podré analizar tus métricas de verdad.",
  "Te escucho perfectamente. Razonar todavía no me toca — eso llega en la fase de APIs.",
];

// Tipos mínimos de Web Speech (no están completos en lib.dom)
type SRResult = { 0: { transcript: string }; isFinal: boolean };
type SREvent = { results: { length: number; [i: number]: SRResult }; resultIndex: number };
type SpeechRec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type SpeechRecCtor = new () => SpeechRec;

function getSpeechRecCtor(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function JarvisStage({ left, right }: { left: ReactNode; right: ReactNode }) {
  const levelRef = useRef(0);
  const [lines, setLines] = useState<Line[]>([
    { who: "jarvis", text: "J.A.R.V.I.S. operativo. Escríbeme o tócame el micrófono." },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const replyIdx = useRef(0);
  const recRef = useRef<SpeechRec | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; raf: number } | null>(null);

  useEffect(() => {
    setMicSupported(getSpeechRecCtor() !== null);
    return () => stopMicAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function blip(freq: number) {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.04;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
      osc.onended = () => ctx.close();
    } catch { /* sin audio, sin drama */ }
  }

  async function startMicAnalysis() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    function loop() {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      levelRef.current = Math.min(1, (sum / data.length / 255) * 2.2);
      const raf = requestAnimationFrame(loop);
      if (audioRef.current) audioRef.current.raf = raf;
    }
    audioRef.current = { ctx, stream, raf: requestAnimationFrame(loop) };
  }

  function stopMicAnalysis() {
    const a = audioRef.current;
    if (!a) return;
    cancelAnimationFrame(a.raf);
    a.stream.getTracks().forEach((t) => t.stop());
    a.ctx.close().catch(() => {});
    audioRef.current = null;
    levelRef.current = 0;
  }

  function speak(text: string) {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voz = speechSynthesis.getVoices().find((v) => v.lang.startsWith("es"));
    if (voz) u.voice = voz;
    u.rate = 1.05;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    speechSynthesis.speak(u);
  }

  // mientras Jarvis habla, el orbe vibra con onda sintética
  useEffect(() => {
    if (!speaking) return;
    let raf = 0;
    const t0 = performance.now();
    function wave(now: number) {
      const t = (now - t0) / 1000;
      levelRef.current = 0.35 + Math.abs(Math.sin(t * 7)) * 0.3 + Math.random() * 0.08;
      raf = requestAnimationFrame(wave);
    }
    raf = requestAnimationFrame(wave);
    return () => {
      cancelAnimationFrame(raf);
      if (!audioRef.current) levelRef.current = 0;
    };
  }, [speaking]);

  function handleUser(text: string) {
    const reply = DEMO_REPLIES[replyIdx.current % DEMO_REPLIES.length];
    replyIdx.current += 1;
    setLines((l) => [...l, { who: "tú", text }, { who: "jarvis", text: reply }]);
    speak(reply);
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    blip(880);
    setInput("");
    handleUser(text);
  }

  async function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecCtor();
    if (!Ctor) return;
    try {
      await startMicAnalysis();
    } catch {
      return; // permiso de mic denegado
    }
    const rec = new Ctor();
    rec.lang = "es-CO";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (transcript) handleUser(transcript);
    };
    rec.onerror = () => {};
    rec.onend = () => {
      setListening(false);
      stopMicAnalysis();
    };
    recRef.current = rec;
    setListening(true);
    blip(660);
    rec.start();
  }

  return (
    <>
      <div className="flex items-center gap-10 z-10">
        <div className="hidden md:flex flex-col gap-3">{left}</div>
        <JarvisOrb size={300} levelRef={levelRef} />
        <div className="hidden md:flex flex-col gap-3">{right}</div>
      </div>

      <div className="mt-8 z-10 w-full flex justify-center px-6">
        <div className="w-full max-w-xl">
          <div className="max-h-40 overflow-y-auto space-y-1 mb-3 px-1">
            {lines.slice(-6).map((l, i) => (
              <p key={i} className="text-sm">
                <span className={l.who === "jarvis" ? "text-accent" : "text-dim"}>{l.who === "jarvis" ? "◉ " : "▸ "}</span>
                <span className={l.who === "jarvis" ? "text-foreground" : "text-muted"}>{l.text}</span>
              </p>
            ))}
            {listening && <p className="text-sm text-accent animate-pulse">◉ escuchando…</p>}
          </div>
          <div className="flex gap-2">
            {micSupported && (
              <button onClick={toggleMic} title={listening ? "Dejar de escuchar" : "Hablar con Jarvis"}
                className={`w-11 rounded-lg border text-lg ${listening ? "border-red-400 text-red-400 animate-pulse" : "border-accent/40 text-accent hover:border-accent"}`}>
                {listening ? "■" : "🎙"}
              </button>
            )}
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={micSupported ? "Habla o escribe…" : "Escríbele a J.A.R.V.I.S.…"}
              className="flex-1 bg-surface/80 border border-accent/30 rounded-lg px-4 py-2 text-sm text-bright placeholder:text-dim backdrop-blur" />
            <button onClick={send} disabled={!input.trim()}
              className="bg-accent/20 border border-accent/50 text-bright rounded-lg px-4 disabled:opacity-40">➤</button>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Borrar `web/src/components/JarvisConsole.tsx`** (`git rm web/src/components/JarvisConsole.tsx`).

- [ ] **Step 4: Reemplazar `web/src/app/jarvis/page.tsx` completo** (readouts server-side pasan como props):

```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import JarvisStage from "@/components/JarvisStage";

export const dynamic = "force-dynamic";

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 bg-surface/40 rounded-lg px-4 py-3 backdrop-blur">
      <div className="text-[9px] tracking-[0.2em] text-dim uppercase">{label}</div>
      <div className="text-xl font-extrabold text-bright">{value}</div>
    </div>
  );
}

export default async function JarvisPage() {
  const supabase = await createClient();
  const brand = await getActiveBrand();
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: snaps }, { count: autoAgents }] = await Promise.all([
    supabase.from("snapshots")
      .select("platform,snapshot_date,followers,total_views,posts_count")
      .eq("brand_id", brand.id).gte("snapshot_date", since),
    supabase.from("agent_settings")
      .select("agent_id", { count: "exact", head: true })
      .eq("brand_id", brand.id).neq("autonomy", "manual"),
  ]);
  const youtube = computeDeltas(((snaps ?? []) as SnapshotRow[]).filter((r) => r.platform === "youtube"));

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(#4f8cff 1px, transparent 1px), linear-gradient(90deg, #4f8cff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <Link href="/" className="absolute top-5 left-6 text-dim hover:text-muted text-sm z-10">← salir</Link>
      <div className="absolute top-5 right-6 text-[10px] tracking-[0.25em] text-dim z-10">
        MARCA: <span className="text-accent">{brand.name.toUpperCase()}</span>
      </div>

      <p className="text-[10px] tracking-[0.4em] text-accent mb-2 z-10">✦ COMMAND CENTER · VANTAGE STUDIO</p>
      <h1 className="text-4xl font-extrabold text-bright tracking-[0.2em] mb-6 z-10">J.A.R.V.I.S.</h1>

      <JarvisStage
        left={
          <>
            <Readout label="Suscriptores YT" value={youtube.current?.toLocaleString("es-CO") ?? "—"} />
            <Readout label="Vs ayer" value={youtube.vsYesterday != null ? `${youtube.vsYesterday >= 0 ? "+" : ""}${youtube.vsYesterday}` : "—"} />
          </>
        }
        right={
          <>
            <Readout label="Agentes activos" value={String(autoAgents ?? 0)} />
            <Readout label="Voz" value="EN LÍNEA" />
          </>
        }
      />
    </div>
  );
}
```

- [ ] **Step 5: Verificar** → `npm test && npm run lint && npm run build` verdes; confirmar que `JarvisConsole.tsx` ya no existe ni se importa en ningún lado (`grep -rn "JarvisConsole" web/src/` vacío).

- [ ] **Step 6: Commit**

```bash
git add -A web/src/components/JarvisOrb.tsx web/src/components/JarvisStage.tsx web/src/components/JarvisConsole.tsx web/src/app/jarvis/page.tsx
git commit -m "feat: voz de Jarvis — Web Speech + orbe reactivo al micrófono"
```

---

### Task 4: Cierre

- [ ] **Step 1: Suite completa** → `npm test && npm run lint && npm run build` todo verde (26 tests).
- [ ] **Step 2:** El merge a main, push y verificación de deploy los hace el controlador.

**Notas de comportamiento esperado (para la prueba manual de Gio):**
- En Chrome/Edge/Safari: botón 🎙 visible; al tocarlo pide permiso de micrófono; el orbe vibra con tu voz; al terminar de hablar, Jarvis transcribe, responde en texto Y con voz en español, y el orbe vibra mientras habla.
- En Firefox: el botón de mic se oculta solo (no hay SpeechRecognition); el chat de texto + voz de respuesta siguen funcionando.
- Carrusel: "Exportar PNG" descarga 5 archivos `carrusel-slide-N.png` de 1080×1350.
