"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { type AdminActionState } from "@/lib/admin/state";
import {
  adminDeleteGuide,
  createGuide,
  hideGuide,
  publishGuide,
  updateGuide,
} from "@/lib/db/guides";
import { ROUTES } from "@/constants/routes";
import { type GuideCategoryId } from "@/constants/guides";
import { parseGuideFormData } from "@/lib/validations/guideSchema";

export type GuideFormState = AdminActionState & {
  fieldErrors?: Record<string, string>;
  guideId?: string;
};

function revalidateGuidePaths() {
  revalidatePath(ROUTES.admin);
  revalidatePath(ROUTES.guides.list);
}

async function runGuideMutation(
  action: () => Promise<void>,
  successMessage: string,
): Promise<GuideFormState> {
  try {
    await action();
    revalidateGuidePaths();
    return { success: successMessage };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "操作失败，请稍后重试",
    };
  }
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

export async function createGuideAction(
  _prevState: GuideFormState,
  formData: FormData,
): Promise<GuideFormState> {
  const admin = await requireAdmin();
  const parsed = parseGuideFormData(formData, "create");

  if (!parsed.success) {
    return {
      error: "请检查表单内容",
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  const values = parsed.data;
  const category = values.category as GuideCategoryId;

  try {
    const guideId = await createGuide(
      {
        userId: admin.id,
        title: values.title,
        excerpt: values.excerpt ?? null,
        content: values.content,
        category,
        targetAudience: values.targetAudience ?? null,
        estimatedReadingTime: values.estimatedReadingTime ?? null,
        sourceLinks: values.sourceLinks,
      },
      admin.id,
    );

    revalidateGuidePaths();
    return {
      success: "攻略已创建为草稿",
      guideId,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "创建攻略失败，请稍后重试",
    };
  }
}

export async function updateGuideAction(
  _prevState: GuideFormState,
  formData: FormData,
): Promise<GuideFormState> {
  const admin = await requireAdmin();
  const parsed = parseGuideFormData(formData, "update");

  if (!parsed.success) {
    return {
      error: "请检查表单内容",
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  const values = parsed.data;
  const category = values.category as GuideCategoryId;

  if (!("guideId" in values) || typeof values.guideId !== "string") {
    return { error: "无效的攻略 ID" };
  }

  const guideId = values.guideId;

  return runGuideMutation(
    () =>
      updateGuide(
        {
          id: guideId,
          userId: admin.id,
          title: values.title,
          excerpt: values.excerpt ?? null,
          content: values.content,
          category,
          targetAudience: values.targetAudience ?? null,
          estimatedReadingTime: values.estimatedReadingTime ?? null,
          sourceLinks: values.sourceLinks,
        },
        admin.id,
      ),
    "攻略已更新",
  );
}

export async function publishGuideAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const guideId = String(formData.get("guideId") ?? "");

  if (!guideId) {
    return { error: "无效的攻略 ID" };
  }

  return runGuideMutation(
    () => publishGuide(guideId, admin.id),
    "攻略已发布",
  );
}

export async function hideGuideAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const guideId = String(formData.get("guideId") ?? "");

  if (!guideId) {
    return { error: "无效的攻略 ID" };
  }

  return runGuideMutation(
    () => hideGuide(guideId, admin.id),
    "攻略已隐藏",
  );
}

export async function deleteGuideAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const guideId = String(formData.get("guideId") ?? "");

  if (!guideId) {
    return { error: "无效的攻略 ID" };
  }

  return runGuideMutation(
    () => adminDeleteGuide(guideId, admin.id),
    "攻略已删除",
  );
}
