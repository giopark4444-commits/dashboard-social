import PageHeader from "@/components/PageHeader";
import { DEMO_VIDEO } from "@/lib/demo-data";

const FUERZA_CLS: Record<string, string> = { alta: "bg-ok", media: "bg-warn", baja: "bg-red-400" };

export default function VideoPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="CONTENIDO" title="VIDEO ANALYSIS" demo />
      <p className="text-xs text-dim mb-5">
        Desglose de un video: hook, estructura, ritmo y CTA. En la fase final subirás cualquier video (tuyo o de la competencia) y la IA lo analiza.
      </p>

      <div className="bg-surface border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-bright">{DEMO_VIDEO.titulo}</div>
            <div className="text-xs text-dim">duración {DEMO_VIDEO.duracion}</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-accent">{DEMO_VIDEO.hookScore}</div>
            <div className="text-[9px] tracking-widest text-dim uppercase">hook score</div>
          </div>
        </div>

        {/* línea de tiempo */}
        <div className="flex h-2 rounded-full overflow-hidden mb-4">
          {DEMO_VIDEO.segments.map((s, i) => (
            <div key={i} className={`${FUERZA_CLS[s.fuerza]} opacity-80`} style={{ flex: 1 }} title={s.etiqueta} />
          ))}
        </div>

        <div className="space-y-3">
          {DEMO_VIDEO.segments.map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-[10px] text-dim w-20 shrink-0 pt-0.5">{s.from}–{s.to}</span>
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${FUERZA_CLS[s.fuerza]}`} />
              <div>
                <span className="text-sm font-bold text-bright">{s.etiqueta}</span>
                <p className="text-xs text-muted">{s.nota}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] tracking-widest text-dim mb-2">✦ RECOMENDACIONES</p>
      <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
        {DEMO_VIDEO.recomendaciones.map((r, i) => (
          <p key={i} className="text-sm text-foreground">▸ {r}</p>
        ))}
      </div>
    </div>
  );
}
