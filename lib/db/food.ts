import { type FoodFilters, type FoodPlaceWithStats } from "@/types/food";
import { type PaginatedResult } from "@/types/common";
import { getPagination, toPaginatedResult } from "@/lib/db/shared";

export async function listFoodPlaces(
  filters: FoodFilters = {},
): Promise<PaginatedResult<FoodPlaceWithStats>> {
  const { page = 1, pageSize = 20 } = filters;
  const pagination = getPagination(page, pageSize);

  return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
}

export async function getFoodPlaceById(_id: string) {
  return null;
}

export async function createFoodRecommendation(_input: unknown) {
    throw new Error("功能尚未开放，请先配置数据库");
}
