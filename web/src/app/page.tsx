import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import { PlatformColumn, DemoColumn } from "@/components/PlatformColumn";
import RefreshButton from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const brand = await getActiveBrand();
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const [{ data: snaps }, { count: autoAgents }, { data: runs }] = await Promise.all([
    supabase.from("snapshots")
      .select("platform,snapshot_date,followers,total_views,posts_count")
      .eq("brand_id", brand.id).gte("snapshot_date", since),
    supabase.from("agent_settings")
      .select("agent_id", { count: "exact", head: true })
      .eq("brand_id", brand.id).neq("autonomy", "manual"),
    supabase.from("agent_runs").select("id,agent_id,action,status,created_at")
      .eq("brand_id", brand.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const rows = (snaps ?? []) as SnapshotRow[];
  const youtube = computeDeltas(rows.filter((r) => r.platform === "youtube"));

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-accent">
            ✦ COMMAND CENTER · {brand.name.toUpperCase()}
          </p>
          <h1 className="text-3xl font-extrabold text-bright tracking-wider">VANTAGE STUDIO</h1>
        </div>
        <RefreshButton />
      </div>
      <p className="text-xs text-dim tracking-widest mb-4">CMO AGENT + ANALYTICS</p>

      <Link href="/jarvis"
        className="block bg-gradient-to-r from-surface-2 to-surface border border-accent/40 rounded-xl p-4 mb-6 hover:border-accent">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-accent">◉</span>
          <div>
            <div className="font-bold text-bright tracking-widest">J.A.R.V.I.S. — Launch Fullscreen</div>
            <div className="text-[10px] text-dim tracking-widest">ORBE 3D AUDIO-REACTIVO · LLEGA EN FASE 3</div>
          </div>
        </div>
      </Link>

      <p className="text-[10px] tracking-widest text-dim mb-2">✦ CANALES</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <PlatformColumn name="YouTube" icon="▶" unit="suscriptores" deltas={youtube} />
        <DemoColumn name="Instagram" icon="◎" note="se conecta en Fase 7 (trámites Meta)" />
        <DemoColumn name="Meta Ads" icon="▣" note="se conecta en Fase 7 (trámites Meta)" />
        <DemoColumn name="WhatsApp" icon="✆" note="llega en Fase 5 (runner)" />
      </div>

      <p className="text-[10px] tracking-widest text-dim mb-2">✦ AGENTES</p>
      <div className="flex flex-col md:flex-row gap-3">
        <Link href="/agentes"
          className="flex-1 bg-surface border border-border rounded-xl p-4 hover:border-accent/50">
          <div className="text-2xl font-extrabold text-bright">{autoAgents ?? 0}</div>
          <div className="text-xs text-dim">agentes en copiloto/auto · configurar →</div>
        </Link>
        <div className="flex-[2] bg-surface border border-border rounded-xl p-4">
          <div className="text-[10px] tracking-widest text-dim mb-1">ÚLTIMA ACTIVIDAD</div>
          {(runs ?? []).length === 0 ? (
            <p className="text-xs text-dim">Sin actividad aún — los agentes despiertan en la Fase 2.</p>
          ) : (
            (runs ?? []).map((r) => (
              <div key={r.id} className="text-xs text-muted">
                <span className={r.status === "ok" ? "text-ok" : r.status === "error" ? "text-red-400" : "text-warn"}>●</span>{" "}
                {r.agent_id} · {r.action}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
