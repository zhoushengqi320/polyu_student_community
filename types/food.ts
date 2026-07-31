import { type ContentStatus } from "@/constants/contentStatus";
import { type FoodAreaId } from "@/constants/categories";
import { type ProfileListItem } from "@/types/user";

export type FoodPlace = {
  id: string;
  name: string;
  area: FoodAreaId;
  address: string | null;
  tags: string[];
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type FoodRecommendation = {
  id: string;
  placeId: string;
  userId: string;
  rating: number;
  content: string;
  status: ContentStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FoodPlaceWithStats = FoodPlace & {
  recommendationCount: number;
  averageRating: number | null;
};

export type FoodRecommendationWithAuthor = FoodRecommendation & {
  author: ProfileListItem;
};

export type FoodPlaceDetail = FoodPlaceWithStats & {
  recommendations: FoodRecommendationWithAuthor[];
};

export type FoodFilters = {
  area?: FoodAreaId;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type CreateFoodPlaceInput = {
  name: string;
  area: FoodAreaId;
  address?: string | null;
  tags?: string[];
};

export type CreateFoodRecommendationInput = {
  placeId: string;
  userId: string;
  rating: number;
  content: string;
};
