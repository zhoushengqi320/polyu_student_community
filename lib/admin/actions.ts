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
import {
  addEmailToWhitelist,
  removeUnusedWhitelistEntry,
} from "@/lib/db/emailWhitelist";
import { getContentSnapshot } from "@/lib/db/moderation";
import {
  listContentViewersForAdmin,
  listReactionUsersForAdmin,
  type ContentEngagementUser,
} from "@/lib/db/contentViews";
import { logAdminAction, updateReportStatus } from "@/lib/db/reports";
import { DbError } from "@/lib/db/shared";
import {
  confirmReportViolation,
  dismissReportWithReview,
  approveArchiveAppeal,
  rejectArchiveAppealReview,
} from "@/lib/moderation/reportWorkflow";
import { REPORT_STATUS, TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { type TargetType } from "@/constants/reportReasons";
import { parseAdminReviewReason } from "@/lib/admin/reviewReason";
import {
  resolveAdminActionLogDetail,
  type AdminActionLogDetail,
} from "@/lib/admin/actionLogDetail";
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
  ownerId: string | null;
  authorName: string | null;
  likeUsers: ContentEngagementUser[];
  favoriteUsers: ContentEngagementUser[];
  viewUsers: ContentEngagementUser[];
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

    let authorName: string | null = null;
    if (snapshot.ownerId) {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();
        const { data: profile } = await admin
          .from("profiles")
          .select("username, display_name, approved_nickname, nickname")
          .eq("id", snapshot.ownerId)
          .maybeSingle();
        if (profile) {
          authorName =
            (profile.approved_nickname as string | null) ||
            (profile.display_name as string | null) ||
            (profile.nickname as string | null) ||
            (profile.username as string | null) ||
            null;
        }
      } catch {
        authorName = null;
      }
    }

    const [likeUsers, favoriteUsers, viewUsers] = await Promise.all([
      listReactionUsersForAdmin({
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        type: "like",
      }).catch(() => []),
      listReactionUsersForAdmin({
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        type: "favorite",
      }).catch(() => []),
      listContentViewersForAdmin({
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
      }).catch(() => []),
    ]);

    const title =
      snapshot.title ??
      (parsed.data.targetType === "comment"
        ? `评论：${snapshot.excerpt ?? "（无摘要）"}`
        : parsed.data.targetType === "course_review"
          ? `课程评价：${snapshot.excerpt ?? "（无摘要）"}`
          : parsed.data.targetType === "food_recommendation"
            ? `美食推荐：${snapshot.excerpt ?? "（无摘要）"}`
            : null);

    return {
      data: {
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        title,
        body: snapshot.body,
        excerpt: snapshot.excerpt,
        module: snapshot.module,
        deletedAt: snapshot.deletedAt,
        status: snapshot.status,
        ownerId: snapshot.ownerId,
        authorName,
        likeUsers,
        favoriteUsers,
        viewUsers,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "预览加载失败",
    };
  }
}

const actionLogDetailSchema = z.object({
  targetType: z.string().min(1),
  targetId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function getAdminActionLogDetailAction(input: {
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
}): Promise<{ data?: AdminActionLogDetail; error?: string }> {
  try {
    await requireAdmin();
    const parsed = actionLogDetailSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "无效的操作记录目标" };
    }

    const data = await resolveAdminActionLogDetail({
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      metadata: parsed.data.metadata ?? null,
    });

    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "详情加载失败",
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
    if (error instanceof DbError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : "操作失败，请稍后重试",
    };
  }
}

function readReviewReason(formData: FormData): string {
  return parseAdminReviewReason(formData.get("reason"));
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

export async function addEmailWhitelistAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const admin = await requireAdmin();
    const email = String(formData.get("email") ?? "");
    const note = String(formData.get("note") ?? "");

    const row = await addEmailToWhitelist({
      email,
      note,
      createdBy: admin.id,
    });

    await logAdminAction({
      adminId: admin.id,
      action: "add_email_whitelist",
      targetType: "user",
      targetId: admin.id,
      metadata: { email: row.email, whitelistId: row.id, note: row.note },
    });

    revalidatePath(ROUTES.admin);
    return { success: `已将 ${row.email} 加入白名单` };
  } catch (error) {
    if (error instanceof DbError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : "添加白名单失败",
    };
  }
}

export async function removeEmailWhitelistAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    if (!id) {
      return { error: "无效的白名单记录" };
    }

    await removeUnusedWhitelistEntry(id);

    await logAdminAction({
      adminId: admin.id,
      action: "remove_email_whitelist",
      targetType: "user",
      targetId: admin.id,
      metadata: { whitelistId: id },
    });

    revalidatePath(ROUTES.admin);
    return { success: "已删除未使用的白名单记录" };
  } catch (error) {
    if (error instanceof DbError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : "删除失败",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => approveProfileReview(userId, admin.id, reason),
      "资料已通过审核",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写审核理由",
    };
  }
}

export async function rejectProfileReviewAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { error: "无效的用户 ID" };
  }

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => rejectProfileReview(userId, admin.id, reason),
      "资料已驳回",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写审核理由",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => adminDeleteForumPost(postId, admin.id, reason),
      "帖子已删除",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写操作理由",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => adminDeleteReportedPost(postId, admin.id, reason),
      "内容已删除",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写操作理由",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => adminDeleteForumComment(commentId, admin.id, reason),
      "评论已删除",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写操作理由",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => adminDeleteCourseReview(reviewId, admin.id, reason),
      "课程评价已删除",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写操作理由",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => confirmReportViolation(reportId, admin.id, reason),
      "已确认违规并下架内容",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写审核理由",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => dismissReportWithReview(reportId, admin.id, reason),
      "举报已驳回，内容已恢复（如适用）",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写审核理由",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => approveArchiveAppeal(archiveId, admin.id, reason),
      "申诉已通过，内容已恢复",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写审核理由",
    };
  }
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

  try {
    const reason = readReviewReason(formData);
    return runAdminAction(
      () => rejectArchiveAppealReview(archiveId, admin.id, reason),
      "申诉已驳回，已通知作者",
    );
  } catch (error) {
    return {
      error: error instanceof DbError ? error.message : "请填写审核理由",
    };
  }
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
