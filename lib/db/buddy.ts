import { type BuddyFilters, type BuddyPostListItem } from "@/types/buddy";
import { type PaginatedResult } from "@/types/common";
import { getPagination, toPaginatedResult } from "@/lib/db/shared";

export async function listBuddyPosts(
  filters: BuddyFilters = {},
): Promise<PaginatedResult<BuddyPostListItem>> {
  const { page = 1, pageSize = 20 } = filters;
  const pagination = getPagination(page, pageSize);

  return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
}

export async function getBuddyPostById(_id: string) {
  return null;
}

export async function createBuddyPost(_input: unknown) {
    throw new Error("功能尚未开放，请先配置数据库");
}
