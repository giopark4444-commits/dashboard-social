"use client";
import { useState } from "react";
import { DEMO_SLIDES } from "@/lib/demo-data";

export default function CarruselEditor() {
  const [sel, setSel] = useState(0);
  const slide = DEMO_SLIDES[sel];

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
