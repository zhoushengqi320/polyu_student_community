import { CONTENT_STATUS } from "@/constants/contentStatus";
import { type FoodAreaId } from "@/constants/categories";
import { type FoodCategoryId } from "@/constants/foodCategories";
import { mapProfileListItem, type ProfileRow } from "@/lib/db/mappers/profile";
import { type Database, type Json } from "@/types/database";
import {
  type FoodPlace,
  type FoodPlaceWithStats,
  type FoodRecommendation,
  type FoodRecommendationWithAuthor,
} from "@/types/food";

export type FoodPlaceRow = Database["public"]["Tables"]["food_places"]["Row"];
export type FoodRecommendationRow =
  Database["public"]["Tables"]["food_recommendations"]["Row"];

export type FoodRecommendationWithProfileRow = FoodRecommendationRow & {
  profiles: ProfileRow;
};

function readTags(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

export function mapFoodPlace(row: FoodPlaceRow): FoodPlace {
  return {
    id: row.id,
    name: row.name,
    area: row.area as FoodAreaId,
    category: (row.category ?? "restaurant") as FoodCategoryId,
    address: row.address,
    tags: readTags(row.tags),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFoodPlaceWithStats(
  row: FoodPlaceRow,
  stats: { recommendationCount: number; averageRating: number | null },
): FoodPlaceWithStats {
  return {
    ...mapFoodPlace(row),
    recommendationCount: stats.recommendationCount,
    averageRating: stats.averageRating,
  };
}

export function mapFoodRecommendation(
  row: FoodRecommendationRow,
): FoodRecommendation {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    rating: row.rating,
    content: row.content,
    status: row.status,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFoodRecommendationWithAuthor(
  row: FoodRecommendationWithProfileRow,
): FoodRecommendationWithAuthor {
  return {
    ...mapFoodRecommendation(row),
    author: mapProfileListItem(row.profiles),
  };
}

export { CONTENT_STATUS };
