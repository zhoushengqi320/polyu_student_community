import { type ForumCategoryId, type ForumSortId } from "@/constants/forum";
import { type ProfileListItem } from "@/types/user";

export type ForumPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  excerpt: string | null;
  categoryId: string | null;
  topics: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  hotScore: number;
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
  | "categoryId"
  | "topics"
  | "likeCount"
  | "commentCount"
  | "viewCount"
  | "hotScore"
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
  category?: string;
  sort?: ForumSortId;
  page?: number;
  pageSize?: number;
};

export type CreateForumPostInput = {
  userId: string;
  title: string;
  content: string;
  categoryId: ForumCategoryId;
  topics: string[];
  isAnonymous: boolean;
};

export type UpdateForumPostInput = Partial<
  Pick<CreateForumPostInput, "title" | "content" | "categoryId" | "topics" | "isAnonymous">
>;
