"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import {
  adminDeleteCourseReview,
  adminDeleteForumComment,
  adminDeleteForumPost,
  adminDeleteReportedPost,
  banUser,
  hideContent,
  unbanUser,
  verifyPolyuUser,
} from "@/lib/db/admin";
import {
  adminHideFoodPlace,
  adminSoftDeleteFoodRecommendation,
} from "@/lib/db/food";
import { updateReportStatus } from "@/lib/db/reports";
import { REPORT_STATUS } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { type TargetType } from "@/constants/reportReasons";
import { type AdminActionState } from "@/lib/admin/state";

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
    () => updateReportStatus(reportId, admin.id, REPORT_STATUS.dismissed),
    "举报已驳回",
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
