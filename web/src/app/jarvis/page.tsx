import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveBrand } from "@/lib/brands-server";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import JarvisStage from "@/components/JarvisStage";

export const dynamic = "force-dynamic";

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 bg-surface/40 rounded-lg px-4 py-3 backdrop-blur">
      <div className="text-[9px] tracking-[0.2em] text-dim uppercase">{label}</div>
      <div className="text-xl font-extrabold text-bright">{value}</div>
    </div>
  );
}

export default async function JarvisPage() {
  const supabase = await createClient();
  const brand = await getActiveBrand();
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: snaps }, { count: autoAgents }] = await Promise.all([
    supabase.from("snapshots")
      .select("platform,snapshot_date,followers,total_views,posts_count")
      .eq("brand_id", brand.id).gte("snapshot_date", since),
    supabase.from("agent_settings")
      .select("agent_id", { count: "exact", head: true })
      .eq("brand_id", brand.id).neq("autonomy", "manual"),
  ]);
  const youtube = computeDeltas(((snaps ?? []) as SnapshotRow[]).filter((r) => r.platform === "youtube"));

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(#4f8cff 1px, transparent 1px), linear-gradient(90deg, #4f8cff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <Link href="/" className="absolute top-5 left-6 text-dim hover:text-muted text-sm z-10">← salir</Link>
      <div className="absolute top-5 right-6 text-[10px] tracking-[0.25em] text-dim z-10">
        MARCA: <span className="text-accent">{brand.name.toUpperCase()}</span>
      </div>

      <p className="text-[10px] tracking-[0.4em] text-accent mb-2 z-10">✦ COMMAND CENTER · VANTAGE STUDIO</p>
      <h1 className="text-4xl font-extrabold text-bright tracking-[0.2em] mb-6 z-10">J.A.R.V.I.S.</h1>

      <JarvisStage
        left={
          <>
            <Readout label="Suscriptores YT" value={youtube.current?.toLocaleString("es-CO") ?? "—"} />
            <Readout label="Vs ayer" value={youtube.vsYesterday != null ? `${youtube.vsYesterday >= 0 ? "+" : ""}${youtube.vsYesterday}` : "—"} />
          </>
        }
        right={
          <>
            <Readout label="Agentes activos" value={String(autoAgents ?? 0)} />
            <Readout label="Voz" value="EN LÍNEA" />
          </>
        }
      />
    </div>
  );
}
