import { type GuideStageId } from "@/constants/categories";
import { type PostDetail, type PostListItem } from "@/types/post";

export type GuideMeta = {
  postId: string;
  stage: GuideStageId;
  isPinned: boolean;
};

export type GuideListItem = PostListItem & {
  stage: GuideStageId;
  isPinned: boolean;
};

export type GuideDetail = PostDetail & GuideMeta;

export type GuideFilters = {
  stage?: GuideStageId;
  search?: string;
  page?: number;
  pageSize?: number;
};
