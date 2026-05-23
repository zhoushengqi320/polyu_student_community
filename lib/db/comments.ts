import { CONTENT_STATUS } from "@/constants/contentStatus";
import { TARGET_TYPES } from "@/constants/reportReasons";
import {
  mapCommentWithAuthor,
  type CommentWithProfileRow,
} from "@/lib/db/mappers/comment";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  type CommentWithAuthor,
  type CreateCommentInput,
} from "@/types/post";

export async function listCommentsByTarget(
  targetType: string,
  targetId: string,
): Promise<CommentWithAuthor[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", CONTENT_STATUS.published)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to list comments:", error);
    return [];
  }

  return ((data ?? []) as CommentWithProfileRow[]).map(mapCommentWithAuthor);
}

export async function createComment(
  input: CreateCommentInput,
): Promise<CommentWithAuthor> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      target_type: input.targetType,
      target_id: input.targetId,
      user_id: input.userId,
      content: input.content,
      status: CONTENT_STATUS.published,
    })
    .select("*, profiles(*)")
    .single();

  if (error || !data) {
    throw new DbError(error?.message ?? "评论失败", "VALIDATION");
  }

  return mapCommentWithAuthor(data as CommentWithProfileRow);
}

export async function softDeleteComment(id: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new DbError(error.message);
  }
}

export async function listPostComments(postId: string): Promise<CommentWithAuthor[]> {
  return listCommentsByTarget(TARGET_TYPES.post, postId);
}
