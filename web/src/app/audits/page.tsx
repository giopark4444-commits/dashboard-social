import PageHeader from "@/components/PageHeader";
import { DEMO_AUDITS } from "@/lib/demo-data";

const PRIO_CLS: Record<string, string> = { alta: "text-red-400", media: "text-warn", baja: "text-dim" };

export default function AuditsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="INTELIGENCIA" title="AUDIT INBOX" demo />
      <p className="text-xs text-dim mb-5">
        Auditorías periódicas de tus canales. En la fase final, el Auditor (IA) las genera solo con datos reales.
      </p>

      <div className="space-y-4">
        {DEMO_AUDITS.map((a, idx) => (
          <details key={a.id} open={idx === 0} className="bg-surface border border-border rounded-xl">
            <summary className="cursor-pointer p-5 flex items-center gap-4">
              <div className="text-3xl font-extrabold text-accent w-14 text-center shrink-0">{a.score}</div>
              <div className="flex-1">
                <div className="font-bold text-bright">Auditoría de {a.canal}</div>
                <div className="text-xs text-muted">{a.resumen}</div>
              </div>
              <span className="text-[10px] text-dim shrink-0">{a.fecha}</span>
            </summary>
            <div className="px-5 pb-5 space-y-4">
              <div>
                <p className="text-[10px] tracking-widest text-dim mb-1.5">✦ HALLAZGOS</p>
                <div className="space-y-1.5">
                  {a.hallazgos.map((h, i) => (
                    <p key={i} className="text-sm text-foreground flex gap-2">
                      <span className={`shrink-0 font-bold uppercase text-[9px] pt-1 w-12 ${PRIO_CLS[h.prioridad]}`}>{h.prioridad}</span>
                      {h.texto}
                    </p>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-[10px] tracking-widest text-accent mb-1.5">✦ ACCIONES PRIORIZADAS</p>
                <ol className="space-y-1">
                  {a.acciones.map((ac, i) => (
                    <li key={i} className="text-sm text-bright flex gap-2">
                      <span className="text-accent font-bold shrink-0">{i + 1}.</span> {ac}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
