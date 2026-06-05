import { createAdminClient } from "@/lib/supabase/admin";
import { fetchYouTubeStats } from "@/lib/platforms/youtube";

export type SnapshotRow = {
  platform: string;
  snapshot_date: string; // YYYY-MM-DD
  followers: number | null;
  total_views: number | null;
  posts_count: number | null;
};

export type Deltas = {
  current: number | null;
  vsYesterday: number | null;
  vsWeek: number | null;
  spark: number[]; // followers en orden cronológico
};

const DAY_MS = 86_400_000;

/** rows: cualquier orden; usa followers como métrica principal */
export function computeDeltas(rows: SnapshotRow[]): Deltas {
  const sorted = [...rows]
    .filter((r) => r.followers !== null)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)); // asc
  if (sorted.length === 0)
    return { current: null, vsYesterday: null, vsWeek: null, spark: [] };

  const latest = sorted[sorted.length - 1];
  const latestT = Date.parse(latest.snapshot_date);
  const prev = sorted[sorted.length - 2] ?? null;
  const weekAgo = [...sorted].reverse()
    .find((r) => latestT - Date.parse(r.snapshot_date) >= 7 * DAY_MS) ?? null;

  return {
    current: latest.followers,
    vsYesterday: prev ? latest.followers! - prev.followers! : null,
    vsWeek: weekAgo ? latest.followers! - weekAgo.followers! : null,
    spark: sorted.map((r) => r.followers!),
  };
}

/** Consulta las APIs y hace upsert del snapshot de hoy. Una plataforma caída no tumba a las demás. */
export async function runSnapshot(): Promise<{ ok: string[]; failed: string[] }> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const ok: string[] = [];
  const failed: string[] = [];

  // Fase 1: solo YouTube. Fases 4-5 agregan meta/tiktok a esta lista.
  const jobs = [{ platform: "youtube", fetch: fetchYouTubeStats }];

  for (const job of jobs) {
    try {
      const stats = await job.fetch();
      const { error } = await supabase.from("snapshots").upsert(
        {
          platform: stats.platform,
          snapshot_date: today,
          followers: stats.followers,
          total_views: stats.totalViews,
          posts_count: stats.postsCount,
        },
        { onConflict: "platform,snapshot_date" }
      );
      if (error) throw new Error(error.message);
      ok.push(job.platform);
    } catch {
      failed.push(job.platform);
    }
  }
  return { ok, failed };
}
