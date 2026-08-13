"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import {
  adminDeleteCourseReview,
  adminDeleteForumComment,
  adminDeleteForumPost,
  adminDeleteReportedPost,
  approveProfileReview,
  banUser,
  hideContent,
  rejectProfileReview,
  unbanUser,
  verifyPolyuUser,
} from "@/lib/db/admin";
import {
  adminHideFoodPlace,
  adminSoftDeleteFoodRecommendation,
} from "@/lib/db/food";
import { getContentSnapshot } from "@/lib/db/moderation";
import { updateReportStatus } from "@/lib/db/reports";
import {
  confirmReportViolation,
  dismissReportWithReview,
  approveArchiveAppeal,
  rejectArchiveAppealReview,
} from "@/lib/moderation/reportWorkflow";
import { REPORT_STATUS, TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { type TargetType } from "@/constants/reportReasons";
import { type AdminActionState } from "@/lib/admin/state";

const previewSchema = z.object({
  targetType: z.enum([
    TARGET_TYPES.post,
    TARGET_TYPES.comment,
    TARGET_TYPES.course_review,
    TARGET_TYPES.food_place,
    TARGET_TYPES.food_recommendation,
    TARGET_TYPES.course,
    TARGET_TYPES.buddy_post,
    TARGET_TYPES.profile,
  ]),
  targetId: z.string().uuid(),
});

export type AdminContentPreview = {
  targetType: TargetType;
  targetId: string;
  title: string | null;
  body: string | null;
  excerpt: string | null;
  module: string | null;
  deletedAt: string | null;
  status: string | null;
};

export async function getAdminContentPreviewAction(input: {
  targetType: string;
  targetId: string;
}): Promise<{ data?: AdminContentPreview; error?: string }> {
  try {
    await requireAdmin();
    const parsed = previewSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "无效的内容目标" };
    }

    const snapshot = await getContentSnapshot(
      parsed.data.targetType,
      parsed.data.targetId,
    );

    if (!snapshot) {
      return { error: "内容不存在或无法预览" };
    }

    return {
      data: {
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        title: snapshot.title,
        body: snapshot.body,
        excerpt: snapshot.excerpt,
        module: snapshot.module,
        deletedAt: snapshot.deletedAt,
        status: snapshot.status,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "预览加载失败",
    };
  }
}

async function runAdminAction(
  action: () => Promise<void>,
  successMessage: string,
): Promise<AdminActionState> {
  try {
    await action();
    revalidatePath(ROUTES.admin);
    return { success: successMessage };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "操作失败，请稍后重试",
    };
  }
}

export async function banUserAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { error: "无效的用户 ID" };
  }

  return runAdminAction(
    () => banUser(userId, admin.id),
    "用户已封禁",
  );
}

export async function unbanUserAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { error: "无效的用户 ID" };
  }

  return runAdminAction(
    () => unbanUser(userId, admin.id),
    "用户已解封",
  );
}

export async function verifyPolyuUserAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { error: "无效的用户 ID" };
  }

  return runAdminAction(
    () => verifyPolyuUser(userId, admin.id),
    "已授予理大认证",
  );
}

export async function approveProfileReviewAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { error: "无效的用户 ID" };
  }

  return runAdminAction(
    () => approveProfileReview(userId, admin.id),
    "资料已通过审核",
  );
}

export async function rejectProfileReviewAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!userId) {
    return { error: "无效的用户 ID" };
  }

  return runAdminAction(
    () => rejectProfileReview(userId, admin.id, reason),
    "资料已驳回",
  );
}

/** @deprecated 使用 adminDeleteForumPostAction / adminDeleteForumCommentAction */
export async function hideContentAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const targetType = String(formData.get("targetType") ?? "") as TargetType;
  const targetId = String(formData.get("targetId") ?? "");

  if (!targetType || !targetId) {
    return { error: "无效的内容目标" };
  }

  return runAdminAction(
    () => hideContent(targetType, targetId, admin.id),
    "内容已隐藏",
  );
}

export async function adminDeleteForumPostAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");

  if (!postId) {
    return { error: "无效的帖子 ID" };
  }

  return runAdminAction(
    () => adminDeleteForumPost(postId, admin.id),
    "帖子已删除",
  );
}

export async function adminDeleteReportedPostAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");

  if (!postId) {
    return { error: "无效的内容 ID" };
  }

  return runAdminAction(
    () => adminDeleteReportedPost(postId, admin.id),
    "内容已删除",
  );
}

export async function adminDeleteForumCommentAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const commentId = String(formData.get("commentId") ?? "");

  if (!commentId) {
    return { error: "无效的评论 ID" };
  }

  return runAdminAction(
    () => adminDeleteForumComment(commentId, admin.id),
    "评论已删除",
  );
}

export async function adminDeleteCourseReviewAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");

  if (!reviewId) {
    return { error: "无效的课程评价 ID" };
  }

  return runAdminAction(
    () => adminDeleteCourseReview(reviewId, admin.id),
    "课程评价已删除",
  );
}

export async function adminHideFoodPlaceAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const placeId = String(formData.get("placeId") ?? "");

  if (!placeId) {
    return { error: "无效的地点 ID" };
  }

  try {
    await adminHideFoodPlace(placeId, admin.id);
    revalidatePath(ROUTES.admin);
    revalidatePath(ROUTES.food.list);
    revalidatePath(ROUTES.food.detail(placeId));
    return { success: "地点已隐藏" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "操作失败，请稍后重试",
    };
  }
}

export async function adminDeleteFoodRecommendationAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const recommendationId = String(formData.get("recommendationId") ?? "");

  if (!recommendationId) {
    return { error: "无效的推荐 ID" };
  }

  try {
    await adminSoftDeleteFoodRecommendation(recommendationId, admin.id);
    revalidatePath(ROUTES.admin);
    revalidatePath(ROUTES.food.list);
    return { success: "推荐已删除" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "操作失败，请稍后重试",
    };
  }
}

export async function resolveReportAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    return { error: "无效的举报 ID" };
  }

  return runAdminAction(
    () => updateReportStatus(reportId, admin.id, REPORT_STATUS.resolved),
    "举报已处理",
  );
}

export async function confirmReportViolationAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    return { error: "无效的举报 ID" };
  }

  return runAdminAction(
    () => confirmReportViolation(reportId, admin.id),
    "已确认违规并下架内容",
  );
}

export async function dismissReportAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    return { error: "无效的举报 ID" };
  }

  return runAdminAction(
    () => dismissReportWithReview(reportId, admin.id),
    "举报已驳回，内容已恢复（如适用）",
  );
}

export async function approveArchiveAppealAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const archiveId = String(formData.get("archiveId") ?? "");

  if (!archiveId) {
    return { error: "无效的封存 ID" };
  }

  return runAdminAction(
    () => approveArchiveAppeal(archiveId, admin.id),
    "申诉已通过，内容已恢复",
  );
}

export async function rejectArchiveAppealAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const archiveId = String(formData.get("archiveId") ?? "");

  if (!archiveId) {
    return { error: "无效的封存 ID" };
  }

  return runAdminAction(
    () => rejectArchiveAppealReview(archiveId, admin.id),
    "申诉已驳回，已通知作者",
  );
}

export async function markReportReviewedAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");

  if (!reportId) {
    return { error: "无效的举报 ID" };
  }

  return runAdminAction(
    () => updateReportStatus(reportId, admin.id, REPORT_STATUS.reviewed),
    "举报已标记为已审核",
  );
}
