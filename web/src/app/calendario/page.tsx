import PageHeader from "@/components/PageHeader";
import { DEMO_CALENDAR } from "@/lib/demo-data";

const ESTADO_STYLE: Record<string, string> = {
  idea: "border-dim text-dim",
  borrador: "border-warn/60 text-warn",
  aprobado: "border-accent/60 text-accent",
  publicado: "border-ok/60 text-ok",
};

export default function CalendarioPage() {
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // lunes=0
  const monthName = now.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader kicker="CONTENIDO" title="CONTENT CALENDAR" demo />
      <p className="text-xs text-dim mb-2">
        Calendario editorial · <span className="capitalize text-muted">{monthName}</span>. En la fase final, el CMO propondrá huecos y fechas.
      </p>
      <div className="flex gap-3 mb-4 text-[10px]">
        {Object.entries(ESTADO_STYLE).map(([estado, cls]) => (
          <span key={estado} className={`border rounded px-1.5 py-0.5 ${cls}`}>{estado}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-[10px] text-dim tracking-widest mb-1">
        {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((d) => <div key={d} className="px-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => (
          <div key={i} className={`min-h-24 rounded-lg border p-1.5 ${day ? "bg-surface border-border" : "border-transparent"}`}>
            {day && (
              <>
                <div className={`text-[10px] mb-1 ${day === now.getDate() ? "text-accent font-bold" : "text-dim"}`}>{day}</div>
                {DEMO_CALENDAR.filter((c) => c.day === day).map((c) => (
                  <div key={c.id} className={`text-[10px] border rounded px-1.5 py-1 mb-1 leading-tight ${ESTADO_STYLE[c.estado]}`}>
                    <span className="text-muted">{c.canal}</span> · {c.titulo}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
