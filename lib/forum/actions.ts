"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { createComment } from "@/lib/db/comments";
import { createForumPost } from "@/lib/db/forum";
import { type CreateForumPostInput } from "@/types/forum";
import { DbError } from "@/lib/db/shared";
import { commentSchema } from "@/lib/validations/commentSchema";
import { forumPostSchema } from "@/lib/validations/forumPostSchema";
import { postSchema } from "@/lib/validations/postSchema";
import { createPost } from "@/lib/db/posts";
import { assertCan } from "@/lib/utils/permissions";
import { ROUTES } from "@/constants/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PostFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"title" | "content" | "categoryId", string>>;
};

export type ForumPostFormState = {
  error?: string;
  fieldErrors?: Partial<
    Record<"title" | "content" | "categoryId" | "topics", string>
  >;
};

export type CommentFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"content", string>>;
};

function unavailableState(): PostFormState {
  return { error: "数据库未配置，无法发帖。" };
}

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
    categoryId: formData.get("categoryId") || undefined,
    topics: formData.get("topics"),
    isAnonymous: formData.get("isAnonymous"),
  });

  if (!parsed.success) {
    const fieldErrors: ForumPostFormState["fieldErrors"] = {};
    const messages: string[] = [];
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        field === "title" ||
        field === "content" ||
        field === "categoryId" ||
        field === "topics"
      ) {
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
      categoryId: parsed.data.categoryId as CreateForumPostInput["categoryId"],
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

/** @deprecated 使用 createForumPostAction */
export async function createPostAction(
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  if (!isSupabaseConfigured()) {
    return unavailableState();
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

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    categoryId: formData.get("categoryId") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: PostFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "title" || field === "content" || field === "categoryId") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors, error: "请检查表单输入" };
  }

  try {
    const post = await createPost({
      module: "forum",
      userId: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      categoryId: parsed.data.categoryId,
    });

    revalidatePath(ROUTES.forum.list);
    redirect(ROUTES.forum.detail(post.id));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Failed to create post:", error);

    if (error instanceof DbError) {
      return { error: error.message };
    }

    return {
      error: "发帖失败，请稍后重试",
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

    revalidatePath(ROUTES.forum.detail(postId));
    return {};
  } catch (error) {
    return {
      error: "评论失败，请稍后重试",
    };
  }
}
