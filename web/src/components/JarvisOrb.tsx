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
