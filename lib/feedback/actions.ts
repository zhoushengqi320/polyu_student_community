"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createComment } from "@/lib/db/comments";
import {
  createFeedbackPost,
  getFeedbackPostById,
  updateFeedbackPostContent,
} from "@/lib/db/feedback";
import { DbError } from "@/lib/db/shared";
import { buildContentWithUploads } from "@/lib/content/buildContentWithUploads";
import { attachUserUploads } from "@/lib/db/userUploads";
import { validatePendingUploadIds } from "@/lib/content/userUploadActions";
import { assertCan, isAdmin } from "@/lib/utils/permissions";
import { ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { z } from "zod";

export type FeedbackFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"title" | "content", string>>;
};

export type FeedbackReplyState = {
  error?: string;
  fieldErrors?: Partial<Record<"content", string>>;
};

const feedbackPostSchema = z.object({
  title: z.string().trim().min(2, "标题至少 2 个字符").max(100, "标题过长"),
  content: z.string().trim().min(5, "请详细描述问题").max(5000, "内容过长"),
});

const feedbackReplySchema = z.object({
  content: z.string().trim().min(1, "请填写回复内容").max(5000, "内容过长"),
});

export async function createFeedbackPostAction(
  _prevState: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  try {
    assertCan(user, "content:create:feedback");
  } catch {
    return { error: "请先登录后再提交反馈" };
  }

  if (!user) {
    return { error: "请先登录" };
  }

  const uploadIds = formData
    .getAll("uploadIds")
    .map((item) => String(item).trim())
    .filter(Boolean);

  const parsed = feedbackPostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    const fieldErrors: FeedbackFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "title" || field === "content") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查表单输入" };
  }

  const uploadCheck = await validatePendingUploadIds(
    user.id,
    uploadIds,
    "feedback",
  );
  if (!uploadCheck.ok) {
    return { error: uploadCheck.error };
  }

  try {
    const post = await createFeedbackPost({
      userId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
    });

    if (uploadIds.length > 0) {
      const attached = await attachUserUploads({
        userId: user.id,
        uploadIds,
        targetType: "post",
        targetId: post.id,
        module: "feedback",
      });
      const fullContent = buildContentWithUploads(parsed.data.content, attached);
      await updateFeedbackPostContent(post.id, fullContent);
    }

    revalidatePath(ROUTES.feedback.list);
    redirect(ROUTES.feedback.detail(post.id));
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      error: error instanceof DbError ? error.message : "提交失败，请稍后重试",
    };
  }
}

export async function createFeedbackReplyAction(
  postId: string,
  _prevState: FeedbackReplyState,
  formData: FormData,
): Promise<FeedbackReplyState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user || !isAdmin(user)) {
    return { error: "仅管理员可以回复反馈" };
  }

  const post = await getFeedbackPostById(postId);
  if (!post) {
    return { error: "反馈不存在" };
  }

  const parsed = feedbackReplySchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: { content: parsed.error.issues[0]?.message },
      error: "请检查回复内容",
    };
  }

  try {
    await createComment({
      targetType: "post",
      targetId: postId,
      userId: user.id,
      content: parsed.data.content,
      parentId: null,
    });
    revalidatePath(ROUTES.feedback.detail(postId));
    revalidatePath(ROUTES.feedback.list);
    return {};
  } catch {
    return { error: "回复失败，请稍后重试" };
  }
}
