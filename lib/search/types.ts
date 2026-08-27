import { type SearchResultTypeFilter } from "@/lib/validations/searchSchema";

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
  page: number;
  pageSize: number;
  /** 当前筛选下可翻页的结果总数（去重后） */
  total: number;
};

/** 搜索列表每页条数 */
export const SEARCH_PAGE_SIZE = 20;

export function getSearchResultTotalCount(
  result: Pick<GlobalSearchResult, "type" | "counts" | "total">,
): number {
  if (result.type === "all") {
    return result.total;
  }
  return result.counts[result.type] ?? 0;
}
