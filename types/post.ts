import { type ContentStatus } from "@/constants/contentStatus";
import { type ModuleKey } from "@/types/common";
import { type ProfileListItem } from "@/types/user";

export type Post = {
  id: string;
  module: ModuleKey;
  categoryId: string | null;
  userId: string;
  title: string;
  content: string;
  status: ContentStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostListItem = Pick<
  Post,
  "id" | "module" | "categoryId" | "title" | "createdAt" | "updatedAt"
> & {
  author: ProfileListItem;
  commentCount: number;
  likeCount: number;
};

export type PostDetail = Post & {
  author: ProfileListItem;
  commentCount: number;
  likeCount: number;
};

export type CreateCommentInput = {
  targetType: "post";
  targetId: string;
  userId: string;
  content: string;
  parentId?: string | null;
};

export type PostFilters = {
  module: ModuleKey;
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type Comment = {
  id: string;
  targetType: string;
  targetId: string;
  parentId: string | null;
  userId: string;
  content: string;
  status: ContentStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommentWithAuthor = Comment & {
  author: ProfileListItem;
};

export type CommentThreadItem = CommentWithAuthor & {
  replies: CommentThreadItem[];
};
