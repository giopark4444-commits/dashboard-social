import { createClient } from "@/lib/supabase/server";
import { computeDeltas, type SnapshotRow } from "@/lib/snapshots";
import { PlatformColumn, PlaceholderColumn } from "@/components/PlatformColumn";
import RefreshButton from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const supabase = await createClient();
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("snapshots")
    .select("platform,snapshot_date,followers,total_views,posts_count")
    .gte("snapshot_date", since);
  const rows = (data ?? []) as SnapshotRow[];
  const youtube = computeDeltas(rows.filter((r) => r.platform === "youtube"));

  const fecha = new Date().toLocaleDateString("es-CO",
    { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Buenos días Gio 👋</h1>
          <p className="text-sm text-stone-400">{fecha}</p>
        </div>
        <RefreshButton />
      </div>

      <p className="text-[10px] tracking-widest text-stone-400 mb-2">
        ✦ TUS REDES — LADO A LADO
      </p>
      <div className="flex gap-3 mb-6">
        <PlaceholderColumn name="Instagram" emoji="📸" note="se conecta en Fase 4" />
        <PlaceholderColumn name="TikTok" emoji="🎵" note="se conecta en Fase 5" />
        <PlatformColumn name="YouTube" emoji="▶️" unit="suscriptores" deltas={youtube} />
        <PlaceholderColumn name="X / Twitter" emoji="𝕏" note="sin API"
          href="https://x.com" />
      </div>

      <p className="text-[10px] tracking-widest text-stone-400 mb-2">✦ ACCESOS RÁPIDOS</p>
      <div className="flex gap-3">
        {[
          ["💬 WhatsApp", "https://web.whatsapp.com"],
          ["𝕏 Twitter", "https://x.com"],
          ["🎮 Discord DMs", "https://discord.com/channels/@me"],
        ].map(([label, href]) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer"
            className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm shadow-sm hover:bg-stone-100">
            {label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
