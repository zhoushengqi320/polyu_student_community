import { type PostDetail, type PostListItem } from "@/types/post";

export type ContentGuideListItem = PostListItem & {
  excerpt: string | null;
};

export type ContentGuideDetail = PostDetail & {
  excerpt: string | null;
};
