import { FOOD_AREAS } from "@/constants/categories";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { listCourses } from "@/lib/db/courses";
import { listFoodPlaces } from "@/lib/db/food";
import { getForumPosts } from "@/lib/db/forum";
import { listGuides } from "@/lib/db/guides";
import { listPosts } from "@/lib/db/posts";
import {
  type SearchResultTypeFilter,
} from "@/lib/validations/searchSchema";

export type SearchHitType =
  | "course"
  | "forum"
  | "study"
  | "life"
  | "guide"
  | "food";

export type SearchHit = {
  type: SearchHitType;
  id: string;
  title: string;
  href: string;
  excerpt: string | null;
  meta: string | null;
};

export type GlobalSearchResult = {
  query: string;
  type: SearchResultTypeFilter;
  hits: SearchHit[];
  counts: Record<SearchHitType, number>;
};

const PER_TYPE_LIMIT = 8;

function truncate(text: string | null | undefined, max = 120): string | null {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

function shouldInclude(
  filter: SearchResultTypeFilter,
  type: SearchHitType,
): boolean {
  return filter === "all" || filter === type;
}

export async function searchGlobal(input: {
  query: string;
  type?: SearchResultTypeFilter;
}): Promise<GlobalSearchResult> {
  const query = input.query.trim();
  const type = input.type ?? "all";
  const emptyCounts: Record<SearchHitType, number> = {
    course: 0,
    forum: 0,
    study: 0,
    life: 0,
    guide: 0,
    food: 0,
  };

  if (!query) {
    return { query, type, hits: [], counts: emptyCounts };
  }

  const includeGuides = isFeatureEnabled("seasonalGuides");
  const [
    coursesResult,
    forumResult,
    studyResult,
    lifeResult,
    guidesResult,
    foodResult,
  ] = await Promise.all([
    shouldInclude(type, "course")
      ? listCourses({ search: query, pageSize: PER_TYPE_LIMIT, page: 1 })
      : Promise.resolve(null),
    shouldInclude(type, "forum")
      ? getForumPosts({ query, pageSize: PER_TYPE_LIMIT, page: 1 })
      : Promise.resolve(null),
    shouldInclude(type, "study")
      ? listPosts({
          module: "study",
          search: query,
          pageSize: PER_TYPE_LIMIT,
          page: 1,
        })
      : Promise.resolve(null),
    shouldInclude(type, "life")
      ? listPosts({
          module: "life",
          search: query,
          pageSize: PER_TYPE_LIMIT,
          page: 1,
        })
      : Promise.resolve(null),
    shouldInclude(type, "guide") && includeGuides
      ? listGuides({ search: query, pageSize: PER_TYPE_LIMIT, page: 1 })
      : Promise.resolve(null),
    shouldInclude(type, "food")
      ? listFoodPlaces({ search: query, pageSize: PER_TYPE_LIMIT, page: 1 })
      : Promise.resolve(null),
  ]);

  const hits: SearchHit[] = [];
  const counts = { ...emptyCounts };

  if (coursesResult) {
    counts.course = coursesResult.total;
    for (const course of coursesResult.data) {
      hits.push({
        type: "course",
        id: course.id,
        title: `${course.code} · ${course.name}`,
        href: ROUTES.courses.detail(course.code),
        excerpt: truncate(course.description),
        meta: course.department,
      });
    }
  }

  if (forumResult) {
    counts.forum = forumResult.total;
    for (const post of forumResult.data) {
      hits.push({
        type: "forum",
        id: post.id,
        title: post.title,
        href: ROUTES.forum.detail(post.id),
        excerpt: truncate(post.excerpt),
        meta: post.topics.slice(0, 3).map((topic) => `#${topic}`).join(" "),
      });
    }
  }

  if (studyResult) {
    counts.study = studyResult.total;
    for (const post of studyResult.data) {
      hits.push({
        type: "study",
        id: post.id,
        title: post.title,
        href: ROUTES.study.detail(post.id),
        excerpt: null,
        meta: post.categoryId,
      });
    }
  }

  if (lifeResult) {
    counts.life = lifeResult.total;
    for (const post of lifeResult.data) {
      hits.push({
        type: "life",
        id: post.id,
        title: post.title,
        href: ROUTES.life.detail(post.id),
        excerpt: null,
        meta: post.categoryId,
      });
    }
  }

  if (guidesResult) {
    counts.guide = guidesResult.total;
    for (const guide of guidesResult.data) {
      hits.push({
        type: "guide",
        id: guide.id,
        title: guide.title,
        href: ROUTES.guides.detail(guide.id),
        excerpt: truncate(guide.excerpt),
        meta: guide.categoryId,
      });
    }
  }

  if (foodResult) {
    counts.food = foodResult.total;
    for (const place of foodResult.data) {
      hits.push({
        type: "food",
        id: place.id,
        title: place.name,
        href: ROUTES.food.detail(place.id),
        excerpt: truncate(place.address),
        meta:
          FOOD_AREAS.find((item) => item.id === place.area)?.label ?? place.area,
      });
    }
  }

  return { query, type, hits, counts };
}
