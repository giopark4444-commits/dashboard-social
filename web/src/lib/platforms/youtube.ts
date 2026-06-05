export type PlatformStats = {
  platform: "youtube";
  followers: number;
  totalViews: number;
  postsCount: number;
};

type YouTubeChannelsResponse = {
  items?: { statistics?: Record<string, string | boolean> }[];
};

export function parseYouTubeChannel(json: unknown): PlatformStats {
  const item = (json as YouTubeChannelsResponse)?.items?.[0];
  const s = item?.statistics;
  if (!s) throw new Error("YouTube: respuesta sin statistics (¿channel id correcto?)");
  return {
    platform: "youtube",
    followers: Number(s.subscriberCount),
    totalViews: Number(s.viewCount),
    postsCount: Number(s.videoCount),
  };
}

export async function fetchYouTubeStats(): Promise<PlatformStats> {
  const key = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channelId) throw new Error("Faltan YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID");
  const url =
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API respondió ${res.status}`);
  return parseYouTubeChannel(await res.json());
}
