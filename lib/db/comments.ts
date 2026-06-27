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
  type CommentThreadItem,
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

export function buildCommentThread(comments: CommentWithAuthor[]): CommentThreadItem[] {
  const nodes = new Map<string, CommentThreadItem>();

  for (const comment of comments) {
    nodes.set(comment.id, { ...comment, replies: [] });
  }

  const roots: CommentThreadItem[] = [];

  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) {
      continue;
    }

    if (comment.parentId && nodes.has(comment.parentId)) {
      nodes.get(comment.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function listPostCommentThread(postId: string): Promise<CommentThreadItem[]> {
  const comments = await listCommentsByTarget(TARGET_TYPES.post, postId);
  return buildCommentThread(comments);
}

export async function getCommentById(id: string): Promise<CommentWithAuthor | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCommentWithAuthor(data as CommentWithProfileRow);
}

export async function createComment(
  input: CreateCommentInput,
): Promise<CommentWithAuthor> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  if (input.parentId) {
    const parent = await getCommentById(input.parentId);
    if (!parent) {
      throw new DbError("被回复的评论不存在", "VALIDATION");
    }
    if (parent.targetType !== input.targetType || parent.targetId !== input.targetId) {
      throw new DbError("无法回复该评论", "VALIDATION");
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      target_type: input.targetType,
      target_id: input.targetId,
      parent_id: input.parentId ?? null,
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

export function countCommentsInThread(thread: CommentThreadItem[]): number {
  return thread.reduce(
    (total, item) => total + 1 + countCommentsInThread(item.replies),
    0,
  );
}
