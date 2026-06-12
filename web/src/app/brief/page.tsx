import PageHeader from "@/components/PageHeader";
import { DEMO_BRIEF } from "@/lib/demo-data";

export default function BriefPage() {
  const hoy = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="CENTRO" title="DAILY BRIEF" demo>
        <span className="text-xs text-dim capitalize">{hoy}</span>
      </PageHeader>
      <p className="text-xs text-dim mb-5">
        El parte del día. En la fase final, el CMO Agent lo genera cada mañana a las 6:30 con tus datos reales.
      </p>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <section>
          <p className="text-[10px] tracking-widest text-dim mb-1">✦ RESUMEN</p>
          <p className="text-sm text-foreground">{DEMO_BRIEF.resumen}</p>
        </section>

        <section>
          <p className="text-[10px] tracking-widest text-dim mb-1">✦ ALERTAS</p>
          <div className="space-y-1">
            {DEMO_BRIEF.alertas.map((a, i) => (
              <p key={i} className={`text-sm ${a.severidad === "warn" ? "text-warn" : "text-muted"}`}>● {a.texto}</p>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[10px] tracking-widest text-dim mb-1">✦ QUÉ HACER HOY</p>
          <ol className="space-y-1.5">
            {DEMO_BRIEF.acciones.map((a, i) => (
              <li key={i} className="text-sm text-bright flex gap-2">
                <span className="text-accent font-bold shrink-0">{i + 1}.</span> {a}
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-border pt-4">
          <p className="text-[10px] tracking-widest text-accent mb-1">✦ OPORTUNIDAD</p>
          <p className="text-sm text-foreground">{DEMO_BRIEF.oportunidad}</p>
        </section>
      </div>
    </div>
  );
}
