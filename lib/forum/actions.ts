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
  incrementForumPostViewCount,
  updateForumPost,
} from "@/lib/db/forum";
import { createNotification } from "@/lib/db/notifications";
import { DbError } from "@/lib/db/shared";
import {
  assessContentRisk,
  assessForumPostRisk,
} from "@/lib/moderation/contentRisk";
import {
  CONTENT_RISK_LEVELS,
  NOTIFICATION_TYPES,
} from "@/constants/moderation";
import { commentSchema } from "@/lib/validations/commentSchema";
import { forumPostSchema } from "@/lib/validations/forumPostSchema";
import { assertCan, canManageOwnContent } from "@/lib/utils/permissions";
import { ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ForumPostFormState = {
  error?: string;
  success?: string;
  pendingReview?: boolean;
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
    const risk = assessForumPostRisk({
      title: parsed.data.title,
      content: parsed.data.content,
    });

    const post = await createForumPost({
      userId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      topics: parsed.data.topics,
      isAnonymous: parsed.data.isAnonymous,
      riskLevel: risk.level,
    });

    if (risk.level === CONTENT_RISK_LEVELS.high) {
      await createNotification({
        userId: user.id,
        type: NOTIFICATION_TYPES.contentPendingReview,
        title: "帖子待审核",
        body: "您的帖子因触发内容安全检测，已提交审核，审核通过后将公开展示。",
        link: ROUTES.forum.list,
        metadata: { postId: post.id, flags: risk.flags },
      });

      revalidatePath(ROUTES.forum.list);
      return {
        success: "帖子已提交，正在审核中，通过后将公开展示。",
        pendingReview: true,
      };
    }

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
    const risk = assessContentRisk(parsed.data.content);

    await createComment({
      targetType: "post",
      targetId: postId,
      userId: user.id,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
      riskLevel: risk.level,
    });

    if (risk.level === CONTENT_RISK_LEVELS.high) {
      await createNotification({
        userId: user.id,
        type: NOTIFICATION_TYPES.contentPendingReview,
        title: "评论待审核",
        body: "您的评论因触发内容安全检测，已提交审核，审核通过后将公开展示。",
        link: ROUTES.forum.detail(postId),
        metadata: { postId, flags: risk.flags },
      });
    }

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

/** 用户进入帖子详情页时记录浏览（由客户端挂载触发，列表预取不计入） */
export async function recordForumPostViewAction(postId: string): Promise<void> {
  if (!isSupabaseConfigured() || !postId.trim()) {
    return;
  }

  await incrementForumPostViewCount(postId);
  revalidatePath(ROUTES.forum.detail(postId));
  revalidatePath(ROUTES.forum.list);
}
