import { type GuideCategoryId } from "@/constants/guides";
import { type PaginatedResult } from "@/types/common";
import { type PostDetail, type PostListItem } from "@/types/post";

export type GuideSourceLink = {
  label: string;
  url: string;
};

export type GuideMeta = {
  guideId: string;
  stage: string;
  category: GuideCategoryId | string | null;
  targetAudience: string | null;
  estimatedReadingTime: number | null;
  lastVerifiedAt: string | null;
  sourceLinks: GuideSourceLink[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GuideListItem = PostListItem & {
  meta: GuideMeta | null;
  excerpt: string | null;
  isFavorited: boolean;
};

export type GuideDetail = PostDetail & {
  meta: GuideMeta | null;
  isFavorited: boolean;
};

export type GuideFilters = {
  category?: GuideCategoryId | string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type GuideListResult = PaginatedResult<GuideListItem>;
