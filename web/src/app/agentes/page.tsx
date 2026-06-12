import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import { mergeAgentSettings, type AgentSettingRow } from "@/lib/agents";
import AutonomyPicker from "@/components/AutonomyPicker";

export const dynamic = "force-dynamic";

export default async function AgentesPage() {
  const supabase = await createClient();
  const brand = await getActiveBrand();

  const [{ data: settings }, { data: runs }] = await Promise.all([
    supabase.from("agent_settings")
      .select("agent_id,brand_id,autonomy").eq("brand_id", brand.id),
    supabase.from("agent_runs")
      .select("id,agent_id,action,status,cost_usd,created_at")
      .eq("brand_id", brand.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const agents = mergeAgentSettings((settings ?? []) as AgentSettingRow[]);

  return (
    <div className="max-w-4xl">
      <p className="text-[10px] tracking-[0.25em] text-accent">✦ INTELIGENCIA · {brand.name.toUpperCase()}</p>
      <h1 className="text-2xl font-extrabold text-bright tracking-wider mb-1">AGENTES</h1>
      <p className="text-xs text-dim mb-6">
        Autonomía por agente para esta marca: Manual (no hace nada solo) ·
        Copiloto (deja borradores para tu aprobación) · Auto (ejecuta con reglas).
        Los agentes cobran vida desde la Fase 2.
      </p>

      <div className="space-y-2 mb-8">
        {agents.map((a) => (
          <div key={a.id}
            className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4">
            <div className="flex-1">
              <div className="font-bold text-bright">{a.name}
                <span className="ml-2 text-[9px] text-dim tracking-widest uppercase">{a.module}</span>
              </div>
              <div className="text-xs text-muted">{a.desc}</div>
            </div>
            <AutonomyPicker agentId={a.id} brandId={brand.id} value={a.autonomy} />
          </div>
        ))}
      </div>

      <p className="text-[10px] tracking-widest text-dim mb-2">✦ BITÁCORA</p>
      <div className="bg-surface border border-border rounded-xl p-4">
        {(runs ?? []).length === 0 ? (
          <p className="text-xs text-dim">
            Sin actividad aún. Todo lo que un agente haga quedará registrado aquí
            (acción, estado y costo de API).
          </p>
        ) : (
          <table className="w-full text-xs">
            <tbody>
              {(runs ?? []).map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5">
                    <span className={r.status === "ok" ? "text-ok" : r.status === "error" ? "text-red-400" : "text-warn"}>●</span>
                  </td>
                  <td className="text-bright">{r.agent_id}</td>
                  <td className="text-muted">{r.action}</td>
                  <td className="text-dim text-right">
                    {r.cost_usd != null ? `$${Number(r.cost_usd).toFixed(3)}` : ""}
                  </td>
                  <td className="text-dim text-right">
                    {new Date(r.created_at).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
