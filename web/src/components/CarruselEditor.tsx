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
