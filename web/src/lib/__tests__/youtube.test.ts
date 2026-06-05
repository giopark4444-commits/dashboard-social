import { describe, it, expect } from "vitest";
import { parseYouTubeChannel } from "@/lib/platforms/youtube";

const apiResponse = {
  kind: "youtube#channelListResponse",
  items: [
    {
      id: "UC123",
      statistics: {
        viewCount: "8900",
        subscriberCount: "3205",
        hiddenSubscriberCount: false,
        videoCount: "42",
      },
    },
  ],
};

describe("parseYouTubeChannel", () => {
  it("normaliza la respuesta de channels.list", () => {
    expect(parseYouTubeChannel(apiResponse)).toEqual({
      platform: "youtube",
      followers: 3205,
      totalViews: 8900,
      postsCount: 42,
    });
  });

  it("lanza error si no hay items (channel id malo)", () => {
    expect(() => parseYouTubeChannel({ items: [] })).toThrow(/sin statistics/);
  });
});
