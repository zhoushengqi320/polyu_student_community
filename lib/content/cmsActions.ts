"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { type AdminActionState } from "@/lib/admin/state";
import {
  createContentArticle,
  deleteContentArticle,
  hideContentArticle,
  publishContentArticle,
  updateContentArticle,
  type ContentCmsModule,
} from "@/lib/db/contentCms";
import { ROUTES } from "@/constants/routes";
import { z } from "zod";

export type ContentArticleFormState = AdminActionState & {
  fieldErrors?: Record<string, string>;
  articleId?: string;
};

const articleSchema = z.object({
  module: z.enum(["study", "life"]),
  title: z.string().trim().min(2, "标题至少 2 个字").max(200),
  excerpt: z.string().trim().max(300).optional().nullable(),
  content: z.string().trim().min(10, "正文至少 10 个字").max(100000),
});

const updateArticleSchema = articleSchema.extend({
  articleId: z.string().uuid("无效的文章 ID"),
});

function revalidateContentPaths(module: ContentCmsModule) {
  revalidatePath(ROUTES.admin);
  revalidatePath(module === "study" ? ROUTES.study.list : ROUTES.life.list);
}

function mapFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

function parseModule(formData: FormData): ContentCmsModule | null {
  const value = String(formData.get("module") ?? "");
  return value === "study" || value === "life" ? value : null;
}

export async function createContentArticleAction(
  _prev: ContentArticleFormState,
  formData: FormData,
): Promise<ContentArticleFormState> {
  const admin = await requireAdmin();
  const parsed = articleSchema.safeParse({
    module: formData.get("module"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || null,
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return {
      error: "请检查表单内容",
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  try {
    const articleId = await createContentArticle(
      parsed.data.module,
      {
        userId: admin.id,
        title: parsed.data.title,
        excerpt: parsed.data.excerpt ?? null,
        content: parsed.data.content,
        category: null, // 新建不再使用分类；历史字段保留为 null
      },
      admin.id,
    );
    revalidateContentPaths(parsed.data.module);
    return { success: "文章已创建为草稿", articleId };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "创建失败，请稍后重试",
    };
  }
}

export async function updateContentArticleAction(
  _prev: ContentArticleFormState,
  formData: FormData,
): Promise<ContentArticleFormState> {
  const admin = await requireAdmin();
  const parsed = updateArticleSchema.safeParse({
    module: formData.get("module"),
    articleId: formData.get("articleId"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || null,
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return {
      error: "请检查表单内容",
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  try {
    await updateContentArticle(
      parsed.data.module,
      {
        id: parsed.data.articleId,
        userId: admin.id,
        title: parsed.data.title,
        excerpt: parsed.data.excerpt ?? null,
        content: parsed.data.content,
      },
      admin.id,
    );
    revalidateContentPaths(parsed.data.module);
    return { success: "文章已更新", articleId: parsed.data.articleId };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "更新失败，请稍后重试",
    };
  }
}

async function runStatusAction(
  formData: FormData,
  runner: (
    contentModule: ContentCmsModule,
    id: string,
    adminId: string,
  ) => Promise<void>,
  successMessage: string,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const contentModule = parseModule(formData);
  const articleId = String(formData.get("articleId") ?? "");

  if (!contentModule || !articleId) {
    return { error: "无效的文章参数" };
  }

  try {
    await runner(contentModule, articleId, admin.id);
    revalidateContentPaths(contentModule);
    return { success: successMessage };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "操作失败，请稍后重试",
    };
  }
}

export async function publishContentArticleAction(
  _prev: AdminActionState,
  formData: FormData,
) {
  return runStatusAction(formData, publishContentArticle, "文章已发布");
}

export async function hideContentArticleAction(
  _prev: AdminActionState,
  formData: FormData,
) {
  return runStatusAction(formData, hideContentArticle, "文章已隐藏");
}

export async function deleteContentArticleAction(
  _prev: AdminActionState,
  formData: FormData,
) {
  return runStatusAction(formData, deleteContentArticle, "文章已删除");
}
