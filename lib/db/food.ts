import { DEFAULT_SCHOOL_ID } from "@/constants/categories";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { TARGET_TYPES } from "@/constants/reportReasons";
import {
  mapFoodPlace,
  mapFoodPlaceWithStats,
  mapFoodRecommendationWithAuthor,
  type FoodPlaceRow,
  type FoodRecommendationWithProfileRow,
} from "@/lib/db/mappers/food";
import { createAdminAction, resolveReportsForTarget } from "@/lib/db/reports";
import { DbError, getPagination, toPaginatedResult } from "@/lib/db/shared";
import { buildSearchPattern } from "@/lib/utils/search";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type PaginatedResult } from "@/types/common";
import {
  type FoodFilters,
  type FoodPlace,
  type FoodPlaceDetail,
  type FoodPlaceWithStats,
  type FoodRecommendationWithAuthor,
} from "@/types/food";

async function getPlaceStats(placeIds: string[]) {
  const stats = new Map<
    string,
    { recommendationCount: number; averageRating: number | null }
  >();

  for (const id of placeIds) {
    stats.set(id, { recommendationCount: 0, averageRating: null });
  }

  if (placeIds.length === 0 || !isSupabaseConfigured()) {
    return stats;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_recommendations")
    .select("place_id, rating")
    .in("place_id", placeIds)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null);

  if (error) {
    console.error("Failed to load food recommendation stats:", error);
    return stats;
  }

  const buckets = new Map<string, number[]>();
  for (const row of data ?? []) {
    const placeId = String(row.place_id);
    const list = buckets.get(placeId) ?? [];
    list.push(Number(row.rating));
    buckets.set(placeId, list);
  }

  for (const [placeId, ratings] of buckets) {
    const average =
      Math.round(
        (ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10,
      ) / 10;
    stats.set(placeId, {
      recommendationCount: ratings.length,
      averageRating: average,
    });
  }

  return stats;
}

export async function listFoodPlaces(
  filters: FoodFilters = {},
): Promise<PaginatedResult<FoodPlaceWithStats>> {
  const { page = 1, pageSize = 20, area, search } = filters;
  const pagination = getPagination(page, pageSize);

  if (!isSupabaseConfigured()) {
    return toPaginatedResult([], 0, pagination.page, pagination.pageSize);
  }

  const supabase = await createClient();
  let query = supabase
    .from("food_places")
    .select("*", { count: "exact" })
    .eq("status", CONTENT_STATUS.published)
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .order("updated_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (area) {
    query = query.eq("area", area);
  }

  if (search?.trim()) {
    const pattern = buildSearchPattern(search);
    query = query.or(`name.ilike.${pattern},address.ilike.${pattern}`);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new DbError(error.message);
  }

  const rows = (data ?? []) as FoodPlaceRow[];
  const stats = await getPlaceStats(rows.map((row) => row.id));

  return toPaginatedResult(
    rows.map((row) =>
      mapFoodPlaceWithStats(
        row,
        stats.get(row.id) ?? {
          recommendationCount: 0,
          averageRating: null,
        },
      ),
    ),
    count ?? 0,
    pagination.page,
    pagination.pageSize,
  );
}

export async function getFoodPlaceById(
  id: string,
): Promise<FoodPlaceDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_places")
    .select("*")
    .eq("id", id)
    .eq("status", CONTENT_STATUS.published)
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    return null;
  }

  const place = data as FoodPlaceRow;
  const [{ data: recommendations, error: recError }, stats] = await Promise.all([
    supabase
      .from("food_recommendations")
      .select("*, profiles(*)")
      .eq("place_id", id)
      .eq("status", CONTENT_STATUS.published)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getPlaceStats([id]),
  ]);

  if (recError) {
    throw new DbError(recError.message);
  }

  return {
    ...mapFoodPlaceWithStats(
      place,
      stats.get(id) ?? { recommendationCount: 0, averageRating: null },
    ),
    recommendations: ((recommendations ?? []) as FoodRecommendationWithProfileRow[]).map(
      mapFoodRecommendationWithAuthor,
    ),
  };
}

export async function createFoodPlace(input: {
  name: string;
  area: string;
  address?: string | null;
  tags?: string[];
}): Promise<FoodPlace> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_places")
    .insert({
      name: input.name,
      area: input.area,
      address: input.address ?? null,
      tags: input.tags ?? [],
      status: CONTENT_STATUS.published,
      school_id: DEFAULT_SCHOOL_ID,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "创建地点失败");
  }

  return mapFoodPlace(data as FoodPlaceRow);
}

export async function createFoodRecommendation(input: {
  placeId: string;
  userId: string;
  rating: number;
  content: string;
}): Promise<FoodRecommendationWithAuthor> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_recommendations")
    .insert({
      place_id: input.placeId,
      user_id: input.userId,
      rating: input.rating,
      content: input.content,
      status: CONTENT_STATUS.published,
    })
    .select("*, profiles(*)")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "发布推荐失败");
  }

  return mapFoodRecommendationWithAuthor(
    data as FoodRecommendationWithProfileRow,
  );
}

export async function softDeleteFoodRecommendation(
  recommendationId: string,
  userId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_recommendations")
    .update({
      status: CONTENT_STATUS.hidden,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", recommendationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("推荐不存在或无权删除");
  }
}

export async function adminHideFoodPlace(
  placeId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_places")
    .update({ status: CONTENT_STATUS.hidden })
    .eq("id", placeId)
    .neq("status", CONTENT_STATUS.hidden)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }

  if (!data) {
    // 已隐藏也结案举报
    const { data: existing } = await supabase
      .from("food_places")
      .select("id")
      .eq("id", placeId)
      .maybeSingle();
    if (!existing) {
      throw new DbError("地点不存在", "VALIDATION");
    }
  }

  await createAdminAction({
    adminId,
    action: "hide_food_place",
    targetType: TARGET_TYPES.food_place,
    targetId: placeId,
  });
  await resolveReportsForTarget(TARGET_TYPES.food_place, placeId, adminId);
}

export async function adminSoftDeleteFoodRecommendation(
  recommendationId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("food_recommendations")
    .update({
      status: CONTENT_STATUS.hidden,
      deleted_at: deletedAt,
    })
    .eq("id", recommendationId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }

  if (!data) {
    const { data: existing } = await supabase
      .from("food_recommendations")
      .select("id")
      .eq("id", recommendationId)
      .maybeSingle();
    if (!existing) {
      throw new DbError("推荐不存在", "VALIDATION");
    }
  }

  await createAdminAction({
    adminId,
    action: "delete_food_recommendation",
    targetType: TARGET_TYPES.food_recommendation,
    targetId: recommendationId,
    metadata: { deletedAt },
  });
  await resolveReportsForTarget(
    TARGET_TYPES.food_recommendation,
    recommendationId,
    adminId,
  );
}

export async function listFoodPlacesForAdmin(): Promise<FoodPlaceWithStats[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_places")
    .select("*")
    .eq("school_id", DEFAULT_SCHOOL_ID)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new DbError(error.message);
  }

  const rows = (data ?? []) as FoodPlaceRow[];
  const stats = await getPlaceStats(rows.map((row) => row.id));
  return rows.map((row) =>
    mapFoodPlaceWithStats(
      row,
      stats.get(row.id) ?? {
        recommendationCount: 0,
        averageRating: null,
      },
    ),
  );
}

export async function updateFoodPlaceStatus(
  placeId: string,
  status: "published" | "hidden",
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_places")
    .update({ status })
    .eq("id", placeId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("地点不存在或无权更新");
  }
}
