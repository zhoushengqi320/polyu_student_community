import { type ForumSortId } from "@/constants/forum";
import { type ProfileListItem } from "@/types/user";

export type ForumPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  excerpt: string | null;
  /** 历史字段；论坛已取消分类功能，新帖为 null */
  categoryId: string | null;
  topics: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ForumPostListItem = Pick<
  ForumPost,
  | "id"
  | "title"
  | "excerpt"
  | "topics"
  | "likeCount"
  | "commentCount"
  | "viewCount"
  | "isAnonymous"
  | "createdAt"
> & {
  author: ProfileListItem;
};

export type ForumPostDetail = ForumPost & {
  author: ProfileListItem;
};

export type GetForumPostsParams = {
  query?: string;
  topic?: string;
  sort?: ForumSortId;
  page?: number;
  pageSize?: number;
};

import { type ContentRiskLevel } from "@/constants/moderation";

export type CreateForumPostInput = {
  userId: string;
  title: string;
  content: string;
  topics: string[];
  isAnonymous: boolean;
  riskLevel?: ContentRiskLevel;
};

export type UpdateForumPostInput = Partial<
  Pick<CreateForumPostInput, "title" | "content" | "topics" | "isAnonymous">
>;
