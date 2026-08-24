"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { softDeleteComment } from "@/lib/db/comments";
import { toggleReaction, type ReactionType } from "@/lib/db/reactions";
import { getContentOwnerId } from "@/lib/db/moderation";
import { notifyContentInteraction } from "@/lib/notifications/interactionNotifications";
import { createReport } from "@/lib/db/reports";
import { reportSchema } from "@/lib/validations/reportSchema";
import { assertCan, isBanned } from "@/lib/utils/permissions";
import { safeRevalidatePath } from "@/lib/utils/safeRevalidatePath";
import { type TargetType, type ReportReasonId } from "@/constants/reportReasons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { z } from "zod";

export type InteractionActionState = {
  error?: string;
  success?: string;
};

export async function toggleReactionAction(
  _prevState: InteractionActionState,
  formData: FormData,
): Promise<InteractionActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const targetType = String(formData.get("targetType") ?? "") as TargetType;
  const targetId = String(formData.get("targetId") ?? "");
  const type = String(formData.get("type") ?? "") as ReactionType;
  const revalidatePathValue = safeRevalidatePath(
    formData.get("revalidatePath"),
    "/",
  );

  if (
    !targetType ||
    !z.string().uuid().safeParse(targetId).success ||
    (type !== "like" && type !== "favorite")
  ) {
    return { error: "无效的操作参数" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录后再点赞" };
  }

  if (isBanned(user)) {
    return { error: "当前账号无法执行此操作" };
  }

  try {
    assertCan(user, "interaction:like");
  } catch {
    return { error: "当前账号无法执行此操作" };
  }

  try {
    const result = await toggleReaction({
      userId: user.id,
      targetType,
      targetId,
      type,
    });

    if (result === "added") {
      const ownerId = await getContentOwnerId(targetType, targetId);
      await notifyContentInteraction({
        actorUserId: user.id,
        ownerUserId: ownerId,
        targetType,
        targetId,
        kind: type === "favorite" ? "favorite" : "like",
      });
    }

    revalidatePath(revalidatePathValue);
    return {
      success: result === "added" ? "已添加" : "已取消",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "操作失败，请稍后重试",
    };
  }
}

export async function createReportAction(
  _prevState: InteractionActionState,
  formData: FormData,
): Promise<InteractionActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录后再举报" };
  }

  try {
    assertCan(user, "interaction:comment");
  } catch {
    return { error: "当前账号无法举报" };
  }

  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: "请检查举报信息" };
  }

  try {
    const ownerId = await getContentOwnerId(
      parsed.data.targetType as TargetType,
      parsed.data.targetId,
    );
    if (ownerId && ownerId === user.id) {
      return { error: "不能举报自己的内容" };
    }

    const result = await createReport({
      reporterId: user.id,
      targetType: parsed.data.targetType as TargetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason as ReportReasonId,
      description: parsed.data.description,
    });

    const revalidatePathValue = safeRevalidatePath(
      formData.get("revalidatePath"),
      "/",
    );
    revalidatePath(revalidatePathValue);

    if (result.autoHidden) {
      return {
        success:
          "举报已提交。该内容因收到多次举报已暂时隐藏，等待管理员审核。",
      };
    }

    return {
      success:
        "举报已提交，内容仍公开可见。管理员审核后会通知处理结果。",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "举报失败，请稍后重试",
    };
  }
}

export async function deleteCommentAction(
  _prevState: InteractionActionState,
  formData: FormData,
): Promise<InteractionActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "数据库未配置" };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  const commentId = String(formData.get("commentId") ?? "");
  const revalidatePathValue = safeRevalidatePath(
    formData.get("revalidatePath"),
    "/",
  );

  if (!commentId || !z.string().uuid().safeParse(commentId).success) {
    return { error: "无效的评论 ID" };
  }

  try {
    try {
      assertCan(user, "interaction:comment");
    } catch {
      return { error: "当前账号无法删除评论" };
    }
    await softDeleteComment(commentId, user.id);

    revalidatePath(revalidatePathValue);
    return { success: "评论已删除" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "删除失败，请稍后重试",
    };
  }
}
