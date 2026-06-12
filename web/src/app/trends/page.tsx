import PageHeader from "@/components/PageHeader";
import { DEMO_TRENDS } from "@/lib/demo-data";

const TIPO_ICON: Record<string, string> = { tema: "◈", audio: "♫", formato: "▣", hashtag: "#" };

export default function TrendsPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="CONTENIDO" title="TREND SCOUT" demo />
      <p className="text-xs text-dim mb-5">
        Radar de tendencias. En la fase final, el runner las rastrea solo y la IA filtra lo relevante para cada marca.
      </p>
      <div className="space-y-2">
        {DEMO_TRENDS.map((t) => (
          <div key={t.id} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
            <span className="text-accent text-lg w-6 text-center shrink-0">{TIPO_ICON[t.tipo]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-bright truncate">{t.tema}</span>
                <span className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5 uppercase shrink-0">{t.tipo}</span>
              </div>
              <p className="text-xs text-muted mt-0.5">{t.nota}</p>
            </div>
            <div className="w-28 shrink-0">
              <div className="flex justify-between text-[10px] text-dim mb-1"><span>score</span><span className="text-bright">{t.score}</span></div>
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-accent" style={{ width: `${t.score}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
