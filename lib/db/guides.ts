import { type GuideFilters, type GuideListItem } from "@/types/guide";
import { type PaginatedResult } from "@/types/common";
import { getPagination, toPaginatedResult } from "@/lib/db/shared";

export async function listGuides(
  filters: GuideFilters = {},
): Promise<PaginatedResult<GuideListItem>> {
  const { page = 1, pageSize = 20 } = filters;
  const pagination = getPagination(page, pageSize);

  return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
}

export async function getGuideById(_id: string) {
  return null;
}
