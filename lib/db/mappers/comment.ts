import { type ContentStatus } from "@/constants/contentStatus";
import { type Comment, type CommentWithAuthor } from "@/types/post";
import { type Database } from "@/types/database";
import {
  mapProfileListItemOrFallback,
  type ProfileRow,
} from "@/lib/db/mappers/profile";

export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type CommentWithProfileRow = CommentRow & {
  profiles: ProfileRow | null;
};

export function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    parentId: row.parent_id ?? null,
    userId: row.user_id,
    content: row.content,
    status: row.status as ContentStatus,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCommentWithAuthor(row: CommentWithProfileRow): CommentWithAuthor {
  return {
    ...mapComment(row),
    author: mapProfileListItemOrFallback(
      row.profiles,
      row.user_id,
      "已删除用户",
    ),
  };
}
