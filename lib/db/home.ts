import { unstable_noStore as noStore } from "next/cache";
import { FORUM_SEARCH_FETCH_LIMIT, computeForumPostHotScore } from "@/constants/forum";
import { HOME_LIMITS } from "@/constants/home";
import { getForumPosts } from "@/lib/db/forum";
import { listActiveAnnouncements } from "@/lib/db/announcements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type HomePageData, type HomeSectionResult } from "@/types/home";
import { type ForumPostListItem } from "@/types/forum";

function emptySection<T>(): HomeSectionResult<T> {
  return { items: [] };
}

function errorSection<T>(): HomeSectionResult<T> {
  return { items: [], error: true };
}

function getEmptyHomePageData(isDatabaseConfigured: boolean): HomePageData {
  return {
    hottestPosts: emptySection(),
    announcements: [],
    isDatabaseConfigured,
  };
}

function compareHottestForumPosts(
  left: ForumPostListItem,
  right: ForumPostListItem,
): number {
  const scoreDiff =
    computeForumPostHotScore(right) - computeForumPostHotScore(left);
  if (scoreDiff !== 0) {
    return scoreDiff;
  }
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

export async function getHottestForumPosts(
  limit = HOME_LIMITS.hottestPosts,
): Promise<HomeSectionResult<HomePageData["hottestPosts"]["items"][number]>> {
  try {
    const result = await getForumPosts({
      sort: "latest",
      pageSize: FORUM_SEARCH_FETCH_LIMIT,
      page: 1,
    });
    const items = [...result.data]
      .sort(compareHottestForumPosts)
      .slice(0, limit);
    return { items };
  } catch (error) {
    console.error("Failed to get hottest forum posts:", error);
    return errorSection();
  }
}

export async function getHomePageData(): Promise<HomePageData> {
  noStore();
  const isDatabaseConfigured = isSupabaseConfigured();

  if (!isDatabaseConfigured) {
    return getEmptyHomePageData(false);
  }

  const [hottestPosts, announcements] = await Promise.all([
    getHottestForumPosts(),
    listActiveAnnouncements(),
  ]);

  return {
    hottestPosts,
    announcements,
    isDatabaseConfigured: true,
  };
}
