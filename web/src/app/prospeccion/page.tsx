import PageHeader from "@/components/PageHeader";
import { DEMO_PROSPECTS } from "@/lib/demo-data";

const ETAPA_CLS: Record<string, string> = {
  nuevo: "border-dim text-dim",
  contactado: "border-warn/60 text-warn",
  interesado: "border-accent/60 text-accent",
  cliente: "border-ok/60 text-ok",
};

export default function ProspeccionPage() {
  const total = DEMO_PROSPECTS.length;
  const nuevos = DEMO_PROSPECTS.filter((p) => p.etapa === "nuevo").length;
  const calientes = DEMO_PROSPECTS.filter((p) => p.etapa === "interesado").length;

  return (
    <div className="max-w-4xl">
      <PageHeader kicker="CRECIMIENTO" title="PROSPECCIÓN" demo />
      <p className="text-xs text-dim mb-5">
        Tu base de prospects. En la fase final, Prospector (IA) los captura del Inbox y los enriquece solo.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-3xl font-extrabold text-bright">{total}</div>
          <div className="text-[10px] tracking-widest text-dim uppercase">prospects</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-3xl font-extrabold text-bright">{nuevos}</div>
          <div className="text-[10px] tracking-widest text-dim uppercase">nuevos</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-3xl font-extrabold text-accent">{calientes}</div>
          <div className="text-[10px] tracking-widest text-dim uppercase">interesados</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-widest text-dim uppercase border-b border-border">
              <th className="text-left px-4 py-2.5 font-normal">Prospect</th>
              <th className="text-left px-4 py-2.5 font-normal hidden md:table-cell">Fuente</th>
              <th className="text-left px-4 py-2.5 font-normal hidden md:table-cell">Tags</th>
              <th className="text-left px-4 py-2.5 font-normal">Etapa</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PROSPECTS.map((p) => (
              <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-surface-2/50">
                <td className="px-4 py-2.5">
                  <div className="font-bold text-bright">{p.nombre}</div>
                  <div className="text-[10px] text-dim">{p.handle}</div>
                </td>
                <td className="px-4 py-2.5 text-muted hidden md:table-cell">{p.fuente}</td>
                <td className="px-4 py-2.5 hidden md:table-cell">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[9px] border border-border text-dim rounded px-1.5 py-0.5 mr-1">{t}</span>
                  ))}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] border rounded-full px-2 py-0.5 ${ETAPA_CLS[p.etapa]}`}>{p.etapa}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
