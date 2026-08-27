import { type ContentStatus } from "@/constants/contentStatus";
import { type GuideCategoryId } from "@/constants/guides";
import { type PaginatedResult } from "@/types/common";
import { type PostDetail, type PostListItem } from "@/types/post";
import { type ProfileListItem } from "@/types/user";

export type GuideSourceLink = {
  label: string;
  url: string;
};

export type GuideMeta = {
  guideId: string;
  stage: string;
  category: GuideCategoryId | string | null;
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
  /** 仅搜索场景附带，用于抽出关键词所在句 */
  content?: string | null;
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

export type CreateGuideInput = {
  userId: string;
  title: string;
  excerpt?: string | null;
  content: string;
  category: GuideCategoryId;
  sourceLinks: GuideSourceLink[];
};

export type UpdateGuideInput = CreateGuideInput & {
  id: string;
};

export type AdminGuideDetail = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  categoryId: string | null;
  status: ContentStatus;
  deletedAt: string | null;
  author: ProfileListItem;
  meta: GuideMeta | null;
  createdAt: string;
  updatedAt: string;
};
