import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MomentsFeed } from "@/components/feed";
import type { MomentWithEvent, MomentLikeStatus } from "@/lib/types";

const INITIAL_PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Feed | dalat.app",
  description: "Discover moments from past events in Da Lat",
  openGraph: {
    title: "Feed | dalat.app",
    description: "Discover moments from past events in Da Lat",
    type: "website",
  },
};

async function getFeedMoments(): Promise<MomentWithEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_feed_moments", {
    p_limit: INITIAL_PAGE_SIZE,
    p_offset: 0,
    p_content_types: ["photo", "video"],
  });

  if (error) {
    console.error("Failed to fetch feed moments:", error);
    return [];
  }

  return (data ?? []) as MomentWithEvent[];
}

async function getMomentLikes(momentIds: string[]): Promise<MomentLikeStatus[]> {
  if (momentIds.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_moment_like_counts", {
    p_moment_ids: momentIds,
  });

  if (error) {
    console.error("Failed to fetch like counts:", error);
    return [];
  }

  return (data ?? []) as MomentLikeStatus[];
}

export default async function FeedPage() {
  const moments = await getFeedMoments();
  const likeStatuses = await getMomentLikes(moments.map((m) => m.id));
  const hasMore = moments.length === INITIAL_PAGE_SIZE;

  return (
    <main className="bg-black min-h-screen">
      <MomentsFeed
        initialMoments={moments}
        initialLikes={likeStatuses}
        hasMore={hasMore}
      />
    </main>
  );
}
