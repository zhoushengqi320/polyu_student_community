import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { HOME_LIMITS } from "@/constants/home";
import { GUIDE_MODULE } from "@/constants/guides";
import { listCourses } from "@/lib/db/courses";
import { getForumPosts } from "@/lib/db/forum";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type HomeLatestCourseReview,
  type HomePageData,
  type HomeSectionResult,
} from "@/types/home";
import { type GuideListItem, type GuideMeta } from "@/types/guide";
import { type Database } from "@/types/database";
import { mapPostListItem, type PostWithProfileRow } from "@/lib/db/mappers/post";

type GuideMetaRow = Database["public"]["Tables"]["guides_meta"]["Row"];

function emptySection<T>(): HomeSectionResult<T> {
  return { items: [] };
}

function errorSection<T>(): HomeSectionResult<T> {
  return { items: [], error: true };
}

function getEmptyHomePageData(isDatabaseConfigured: boolean): HomePageData {
  return {
    featuredCourses: emptySection(),
    latestReviews: emptySection(),
    latestPosts: emptySection(),
    featuredGuides: emptySection(),
    isDatabaseConfigured,
  };
}

function mapGuideMetaRow(row: GuideMetaRow): GuideMeta {
  const sourceLinks = Array.isArray(row.source_links)
    ? row.source_links
        .map((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return null;
          }
          const label = typeof item.label === "string" ? item.label.trim() : "";
          const url = typeof item.url === "string" ? item.url.trim() : "";
          if (!label || !url) {
            return null;
          }
          return { label, url };
        })
        .filter((item): item is { label: string; url: string } => item !== null)
    : [];

  return {
    guideId: row.post_id,
    stage: row.stage,
    category: row.category,
    targetAudience: row.target_audience,
    estimatedReadingTime: row.estimated_reading_time,
    lastVerifiedAt: row.last_verified_at,
    sourceLinks,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getExcerpt(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 160);
}

export async function getFeaturedCourses(
  limit = HOME_LIMITS.featuredCourses,
): Promise<HomeSectionResult<HomePageData["featuredCourses"]["items"][number]>> {
  try {
    const result = await listCourses({
      sort: "review_count",
      pageSize: limit,
      page: 1,
    });
    return { items: result.data };
  } catch (error) {
    console.error("Failed to get featured courses:", error);
    return errorSection();
  }
}

export async function getLatestCourseReviews(
  limit = HOME_LIMITS.latestReviews,
): Promise<HomeSectionResult<HomeLatestCourseReview>> {
  if (!isSupabaseConfigured()) {
    return emptySection();
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("course_reviews")
      .select("*, courses(id, code, name)")
      .eq("status", CONTENT_STATUS.published)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("Failed to get latest course reviews:", error);
      return errorSection();
    }

    const items = (data as Array<Record<string, unknown>>).map((row) => {
      const course = row.courses as Record<string, unknown> | null;
      const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];

      return {
        id: String(row.id),
        courseId: String(row.course_id),
        courseCode: String(course?.code ?? "UNKNOWN"),
        courseName: String(course?.name ?? "未知课程"),
        overallRating: Number(row.overall_rating ?? 0),
        difficultyRating: Number(row.difficulty_rating ?? 0),
        tags,
        createdAt: String(row.created_at),
      } satisfies HomeLatestCourseReview;
    });

    return { items };
  } catch (error) {
    console.error("Failed to get latest course reviews:", error);
    return errorSection();
  }
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

export async function getFeaturedGuides(
  limit = HOME_LIMITS.featuredGuides,
): Promise<HomeSectionResult<GuideListItem>> {
  if (!isSupabaseConfigured()) {
    return emptySection();
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("module", GUIDE_MODULE)
      .eq("status", CONTENT_STATUS.published)
      .is("deleted_at", null)
      .eq("school_id", DEFAULT_SCHOOL_ID)
      .order("updated_at", { ascending: false })
      .limit(Math.max(limit * 3, limit));

    if (error || !data) {
      console.error("Failed to get featured guides:", error);
      return errorSection();
    }

    const rows = data as PostWithProfileRow[];
    const postIds = rows.map((row) => row.id);

    const { data: metaRows, error: metaError } = await supabase
      .from("guides_meta")
      .select("*")
      .in("post_id", postIds);

    if (metaError) {
      console.error("Failed to get featured guide meta:", metaError);
      return errorSection();
    }

    const metaMap = new Map<string, GuideMeta>();
    for (const row of (metaRows ?? []) as GuideMetaRow[]) {
      metaMap.set(row.post_id, mapGuideMetaRow(row));
    }

    const guides = rows
      .map((row) => ({
        ...mapPostListItem(row, {
          commentCount: row.comment_count ?? 0,
          likeCount: row.like_count ?? 0,
        }),
        meta: metaMap.get(row.id) ?? null,
        excerpt: row.excerpt ?? getExcerpt(row.content),
        isFavorited: false,
      }))
      .sort((left, right) => {
        const leftPinned = left.meta?.isPinned ? 1 : 0;
        const rightPinned = right.meta?.isPinned ? 1 : 0;
        if (leftPinned !== rightPinned) {
          return rightPinned - leftPinned;
        }
        return (
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        );
      })
      .slice(0, limit);

    return { items: guides };
  } catch (error) {
    console.error("Failed to get featured guides:", error);
    return errorSection();
  }
}

export async function getHomePageData(): Promise<HomePageData> {
  const isDatabaseConfigured = isSupabaseConfigured();

  if (!isDatabaseConfigured) {
    return getEmptyHomePageData(false);
  }

  const [featuredCourses, latestReviews, latestPosts, featuredGuides] =
    await Promise.all([
      getFeaturedCourses(),
      getLatestCourseReviews(),
      getLatestForumPosts(),
      getFeaturedGuides(),
    ]);

  return {
    featuredCourses,
    latestReviews,
    latestPosts,
    featuredGuides,
    isDatabaseConfigured: true,
  };
}
