"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createComment } from "@/lib/db/comments";
import {
  createForumPost,
  deleteForumPost,
  getForumPostById,
  updateForumPost,
} from "@/lib/db/forum";
import { DbError } from "@/lib/db/shared";
import { commentSchema } from "@/lib/validations/commentSchema";
import { forumPostSchema } from "@/lib/validations/forumPostSchema";
import { assertCan, canManageOwnContent } from "@/lib/utils/permissions";
import { ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ForumPostFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"title" | "content" | "topics", string>>;
};

export type CommentFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"content", string>>;
};

function unavailableForumState(): ForumPostFormState {
  return { error: "数据库未配置，无法发帖。" };
}

export async function createForumPostAction(
  _prevState: ForumPostFormState,
  formData: FormData,
): Promise<ForumPostFormState> {
  if (!isSupabaseConfigured()) {
    return unavailableForumState();
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:forum");
  } catch {
    return { error: "需要理大认证用户才能发帖" };
  }

  if (!user) {
    return { error: "请先登录" };
  }

  const parsed = forumPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    topics: formData.get("topics"),
    isAnonymous: formData.get("isAnonymous"),
  });

  if (!parsed.success) {
    const fieldErrors: ForumPostFormState["fieldErrors"] = {};
    const messages: string[] = [];
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "title" || field === "content" || field === "topics") {
        fieldErrors[field] = issue.message;
      }
      messages.push(issue.message);
    }
    return {
      fieldErrors,
      error: messages.length > 0 ? messages.join("；") : "请检查表单输入",
    };
  }

  try {
    const post = await createForumPost({
      userId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      topics: parsed.data.topics,
      isAnonymous: parsed.data.isAnonymous,
    });

    revalidatePath(ROUTES.forum.list);
    redirect(ROUTES.forum.detail(post.id));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Failed to create forum post:", error);

    if (error instanceof DbError) {
      return { error: error.message };
    }

    return {
      error: "发帖失败，请稍后重试",
    };
  }
}

export async function updateForumPostAction(
  postId: string,
  _prevState: ForumPostFormState,
  formData: FormData,
): Promise<ForumPostFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置，无法编辑帖子。" };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:forum");
  } catch {
    return { error: "当前账号无法编辑帖子" };
  }

  const post = await getForumPostById(postId);
  if (!user || !post || !canManageOwnContent(user, post.userId)) {
    return { error: "帖子不存在或无权编辑" };
  }

  const parsed = forumPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    topics: formData.get("topics"),
    isAnonymous: formData.get("isAnonymous"),
  });

  if (!parsed.success) {
    const fieldErrors: ForumPostFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "title" || field === "content" || field === "topics") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查表单输入" };
  }

  try {
    await updateForumPost(postId, post.userId, parsed.data);
    revalidatePath(ROUTES.forum.list);
    revalidatePath(ROUTES.forum.detail(postId));
    revalidatePath(ROUTES.forum.edit(postId));
    return { success: "帖子已保存" };
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "更新帖子失败，请稍后重试",
    };
  }
}

export async function deleteForumPostAction(
  postId: string,
  _prevState: ForumPostFormState,
  _formData: FormData,
): Promise<ForumPostFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置，无法删除帖子。" };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:forum");
  } catch {
    return { error: "当前账号无法删除帖子" };
  }

  const post = await getForumPostById(postId);
  if (!user || !post || !canManageOwnContent(user, post.userId)) {
    return { error: "帖子不存在或无权删除" };
  }

  try {
    await deleteForumPost(postId, post.userId);
    revalidatePath(ROUTES.forum.list);
    revalidatePath(ROUTES.forum.detail(postId));
    redirect(ROUTES.forum.list);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      error: error instanceof DbError ? error.message : "删除帖子失败，请稍后重试",
    };
  }
}

export async function createCommentAction(
  postId: string,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置，无法评论。" };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "interaction:comment");
  } catch {
    return { error: "当前账号无法评论" };
  }

  if (!user) {
    return { error: "请先登录后再评论" };
  }

  const parsed = commentSchema.safeParse({
    targetType: "post",
    targetId: postId,
    content: formData.get("content"),
    parentId: formData.get("parentId") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: CommentFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "content") {
        fieldErrors.content = issue.message;
      }
    }
    return { fieldErrors, error: "请检查评论内容" };
  }

  try {
    await createComment({
      targetType: "post",
      targetId: postId,
      userId: user.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    });

    const revalidatePathValue =
      String(formData.get("revalidatePath") ?? "") || ROUTES.forum.detail(postId);
    revalidatePath(revalidatePathValue);
    return {};
  } catch {
    return {
      error: "评论失败，请稍后重试",
    };
  }
}
