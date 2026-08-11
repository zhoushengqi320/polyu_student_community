import { HOME_LIMITS } from "@/constants/home";
import { getForumPosts } from "@/lib/db/forum";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type HomePageData, type HomeSectionResult } from "@/types/home";

function emptySection<T>(): HomeSectionResult<T> {
  return { items: [] };
}

function errorSection<T>(): HomeSectionResult<T> {
  return { items: [], error: true };
}

function getEmptyHomePageData(isDatabaseConfigured: boolean): HomePageData {
  return {
    latestPosts: emptySection(),
    isDatabaseConfigured,
  };
}

export async function getLatestForumPosts(
  limit = HOME_LIMITS.latestPosts,
): Promise<HomeSectionResult<HomePageData["latestPosts"]["items"][number]>> {
  try {
    const result = await getForumPosts({
      sort: "latest",
      pageSize: limit,
      page: 1,
    });
    return { items: result.data };
  } catch (error) {
    console.error("Failed to get latest forum posts:", error);
    return errorSection();
  }
}

export async function getHomePageData(): Promise<HomePageData> {
  const isDatabaseConfigured = isSupabaseConfigured();

  if (!isDatabaseConfigured) {
    return getEmptyHomePageData(false);
  }

  const latestPosts = await getLatestForumPosts();

  return {
    latestPosts,
    isDatabaseConfigured: true,
  };
}
