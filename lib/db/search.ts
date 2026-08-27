import { FOOD_AREAS } from "@/constants/categories";
import { isFeatureEnabled } from "@/constants/features";
import { ROUTES } from "@/constants/routes";
import { listCourses } from "@/lib/db/courses";
import { listFoodPlaces } from "@/lib/db/food";
import { getForumPosts } from "@/lib/db/forum";
import { listGuides } from "@/lib/db/guides";
import { listPosts } from "@/lib/db/posts";
import {
  SEARCH_PAGE_SIZE,
  type GlobalSearchResult,
  type SearchHit,
  type SearchHitType,
} from "@/lib/search/types";
import { extractSearchSnippet } from "@/lib/search/snippet";
import {
  type SearchResultTypeFilter,
} from "@/lib/validations/searchSchema";

export type {
  GlobalSearchResult,
  SearchHit,
  SearchHitType,
} from "@/lib/search/types";
export {
  SEARCH_PAGE_SIZE,
  getSearchResultTotalCount,
} from "@/lib/search/types";

/**
 * 「全部」模式下每种类型最多并入合并列表的条数。
 * 避免一次拉全库；单类型筛选不受此上限，走各模块真实分页。
 */
const SEARCH_ALL_PER_TYPE_CAP = 100;

const SEARCH_HIT_TYPES: SearchHitType[] = [
  "course",
  "forum",
  "study",
  "life",
  "guide",
  "food",
];

function emptyCounts(): Record<SearchHitType, number> {
  return {
    course: 0,
    forum: 0,
    study: 0,
    life: 0,
    guide: 0,
    food: 0,
  };
}

function dedupeHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const result: SearchHit[] = [];
  for (const hit of hits) {
    const key = `${hit.type}:${hit.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(hit);
  }
  return result;
}

function snippetFrom(
  query: string,
  ...sources: Array<string | null | undefined>
): string | null {
  return extractSearchSnippet(sources, query);
}

async function fetchTypeHits(
  type: SearchHitType,
  query: string,
  page: number,
  pageSize: number,
): Promise<{ hits: SearchHit[]; total: number }> {
  switch (type) {
    case "course": {
      const result = await listCourses({ search: query, pageSize, page });
      return {
        total: result.total,
        hits: result.data.map((course) => ({
          type: "course" as const,
          id: course.id,
          title: `${course.code} · ${course.name}`,
          href: ROUTES.courses.detail(course.code),
          excerpt: snippetFrom(
            query,
            course.description,
            course.objectives,
            course.name,
            course.code,
          ),
          meta: course.department,
        })),
      };
    }
    case "forum": {
      const result = await getForumPosts({ query, pageSize, page });
      return {
        total: result.total,
        hits: result.data.map((post) => ({
          type: "forum" as const,
          id: post.id,
          title: post.title,
          href: ROUTES.forum.detail(post.id),
          excerpt: snippetFrom(
            query,
            post.content,
            post.excerpt,
            post.title,
            post.topics.join(" "),
          ),
          meta: post.topics.slice(0, 3).map((topic) => `#${topic}`).join(" "),
        })),
      };
    }
    case "study": {
      const result = await listPosts({
        module: "study",
        search: query,
        pageSize,
        page,
      });
      return {
        total: result.total,
        hits: result.data.map((post) => ({
          type: "study" as const,
          id: post.id,
          title: post.title,
          href: ROUTES.study.detail(post.id),
          excerpt: snippetFrom(query, post.content, post.title),
          meta: post.categoryId,
        })),
      };
    }
    case "life": {
      const result = await listPosts({
        module: "life",
        search: query,
        pageSize,
        page,
      });
      return {
        total: result.total,
        hits: result.data.map((post) => ({
          type: "life" as const,
          id: post.id,
          title: post.title,
          href: ROUTES.life.detail(post.id),
          excerpt: snippetFrom(query, post.content, post.title),
          meta: post.categoryId,
        })),
      };
    }
    case "guide": {
      const result = await listGuides({ search: query, pageSize, page });
      return {
        total: result.total,
        hits: result.data.map((guide) => ({
          type: "guide" as const,
          id: guide.id,
          title: guide.title,
          href: ROUTES.guides.detail(guide.id),
          excerpt: snippetFrom(
            query,
            guide.content,
            guide.excerpt,
            guide.title,
          ),
          meta: guide.categoryId,
        })),
      };
    }
    case "food": {
      const result = await listFoodPlaces({ search: query, pageSize, page });
      return {
        total: result.total,
        hits: result.data.map((place) => ({
          type: "food" as const,
          id: place.id,
          title: place.name,
          href: ROUTES.food.detail(place.id),
          excerpt: snippetFrom(query, place.address, place.name),
          meta:
            FOOD_AREAS.find((item) => item.id === place.area)?.label ??
            place.area,
        })),
      };
    }
    default: {
      return { hits: [], total: 0 };
    }
  }
}

export async function searchGlobal(input: {
  query: string;
  type?: SearchResultTypeFilter;
  page?: number;
  pageSize?: number;
  /** 「全部」模式下每类最多拉取条数，默认 100 */
  mergeCap?: number;
}): Promise<GlobalSearchResult> {
  const query = input.query.trim();
  const type = input.type ?? "all";
  const pageSize = Math.min(
    50,
    Math.max(1, input.pageSize ?? SEARCH_PAGE_SIZE),
  );
  const page = Math.max(1, input.page ?? 1);
  const mergeCap = Math.min(
    SEARCH_ALL_PER_TYPE_CAP,
    Math.max(1, input.mergeCap ?? SEARCH_ALL_PER_TYPE_CAP),
  );
  const counts = emptyCounts();
  const includeGuides = isFeatureEnabled("seasonalGuides");
  const activeTypes = SEARCH_HIT_TYPES.filter(
    (hitType) => hitType !== "guide" || includeGuides,
  );

  if (!query) {
    return {
      query,
      type,
      hits: [],
      counts,
      page,
      pageSize,
      total: 0,
    };
  }

  // 单类型：真实分页，计数与列表一致
  if (type !== "all") {
    const [selected, ...others] = await Promise.all([
      fetchTypeHits(type, query, page, pageSize),
      ...activeTypes
        .filter((hitType) => hitType !== type)
        .map(async (hitType) => {
          const result = await fetchTypeHits(hitType, query, 1, 1);
          return { hitType, total: result.total };
        }),
    ]);

    counts[type] = selected.total;
    for (const other of others) {
      counts[other.hitType] = other.total;
    }

    const hits = dedupeHits(selected.hits);
    return {
      query,
      type,
      hits,
      counts,
      page,
      pageSize,
      total: selected.total,
    };
  }

  // 全部：各类型拉取上限内结果，去重合并后再分页
  const perTypeResults = await Promise.all(
    activeTypes.map(async (hitType) => {
      const result = await fetchTypeHits(hitType, query, 1, mergeCap);
      return { hitType, ...result };
    }),
  );

  const merged: SearchHit[] = [];
  for (const result of perTypeResults) {
    counts[result.hitType] = result.total;
    merged.push(...result.hits);
  }

  const uniqueHits = dedupeHits(merged);
  const browsableTotal = uniqueHits.length;
  const from = (page - 1) * pageSize;
  const hits = uniqueHits.slice(from, from + pageSize);

  return {
    query,
    type,
    hits,
    counts,
    page,
    pageSize,
    total: browsableTotal,
  };
}
