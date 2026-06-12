import PageHeader from "@/components/PageHeader";
import { DEMO_DEALS } from "@/lib/demo-data";

const COLUMNAS: { etapa: "lead" | "contactado" | "demo" | "cierre"; label: string }[] = [
  { etapa: "lead", label: "Lead" },
  { etapa: "contactado", label: "Contactado" },
  { etapa: "demo", label: "Demo" },
  { etapa: "cierre", label: "Cierre" },
];

const fmt = (n: number) => `$${(n / 1000).toFixed(0)}K`;

export default function VentasPage() {
  const totalPipeline = DEMO_DEALS.filter((d) => d.etapa !== "cierre").reduce((s, d) => s + d.valor, 0);
  const cerrado = DEMO_DEALS.filter((d) => d.etapa === "cierre").reduce((s, d) => s + d.valor, 0);

  return (
    <div className="max-w-5xl">
      <PageHeader kicker="CRECIMIENTO" title="VENTAS" demo>
        <div className="text-right">
          <div className="text-xl font-extrabold text-bright">{fmt(totalPipeline)}<span className="text-dim text-sm"> /mes en juego</span></div>
          <div className="text-[10px] text-ok tracking-widest">{fmt(cerrado)}/MES CERRADO</div>
        </div>
      </PageHeader>
      <p className="text-xs text-dim mb-5">Pipeline por marca. Conectado a Prospección: un prospect interesado se convierte en deal.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNAS.map((col) => {
          const deals = DEMO_DEALS.filter((d) => d.etapa === col.etapa);
          const suma = deals.reduce((s, d) => s + d.valor, 0);
          return (
            <div key={col.etapa} className="bg-surface/50 border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] tracking-widest text-dim uppercase">{col.label} ({deals.length})</span>
                <span className="text-[10px] text-muted">{fmt(suma)}</span>
              </div>
              <div className="space-y-2">
                {deals.map((d) => (
                  <div key={d.id} className={`bg-surface border rounded-lg p-3 ${col.etapa === "cierre" ? "border-ok/40" : "border-border hover:border-accent/40"}`}>
                    <div className="text-sm font-bold text-bright leading-tight">{d.nombre}</div>
                    <div className={`text-sm font-extrabold mt-1 ${col.etapa === "cierre" ? "text-ok" : "text-accent"}`}>{fmt(d.valor)}<span className="text-[10px] text-dim font-normal">/mes</span></div>
                    <div className="text-[10px] text-dim mt-1">{d.nota}</div>
                  </div>
                ))}
                {deals.length === 0 && <p className="text-[10px] text-dim px-1">vacío</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
