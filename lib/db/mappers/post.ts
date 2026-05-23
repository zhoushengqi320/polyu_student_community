import { type ContentStatus } from "@/constants/contentStatus";
import { type ModuleKey } from "@/types/common";
import {
  type Post,
  type PostDetail,
  type PostListItem,
} from "@/types/post";
import { type Database } from "@/types/database";
import {
  mapProfileListItem,
  type ProfileRow,
} from "@/lib/db/mappers/profile";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type PostWithProfileRow = PostRow & {
  profiles: ProfileRow;
};

export function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    module: row.module as ModuleKey,
    categoryId: row.category_id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    status: row.status as ContentStatus,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPostListItem(
  row: PostWithProfileRow,
  counts: { commentCount: number; likeCount: number },
): PostListItem {
  const post = mapPost(row);
  return {
    id: post.id,
    module: post.module,
    categoryId: post.categoryId,
    title: post.title,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: mapProfileListItem(row.profiles),
    commentCount: counts.commentCount,
    likeCount: counts.likeCount,
  };
}

export function mapPostDetail(
  row: PostWithProfileRow,
  counts: { commentCount: number; likeCount: number },
): PostDetail {
  return {
    ...mapPost(row),
    author: mapProfileListItem(row.profiles),
    commentCount: counts.commentCount,
    likeCount: counts.likeCount,
  };
}
