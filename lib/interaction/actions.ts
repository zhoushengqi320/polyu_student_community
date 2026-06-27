"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { toggleReaction, type ReactionType } from "@/lib/db/reactions";
import { createReport } from "@/lib/db/reports";
import { reportSchema } from "@/lib/validations/reportSchema";
import { assertCan } from "@/lib/utils/permissions";
import { type TargetType, type ReportReasonId } from "@/constants/reportReasons";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  try {
    assertCan(user, "interaction:like");
  } catch {
    return { error: "当前账号无法执行此操作" };
  }

  const targetType = String(formData.get("targetType") ?? "") as TargetType;
  const targetId = String(formData.get("targetId") ?? "");
  const type = String(formData.get("type") ?? "") as ReactionType;
  const revalidatePathValue = String(formData.get("revalidatePath") ?? "/");

  if (!targetType || !targetId || (type !== "like" && type !== "favorite")) {
    return { error: "无效的操作参数" };
  }

  try {
    const result = await toggleReaction({
      userId: user.id,
      targetType,
      targetId,
      type,
    });

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
    await createReport({
      reporterId: user.id,
      targetType: parsed.data.targetType as TargetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason as ReportReasonId,
      description: parsed.data.description,
    });

    const revalidatePathValue = String(formData.get("revalidatePath") ?? "/");
    revalidatePath(revalidatePathValue);
    return { success: "举报已提交，管理员会尽快处理" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "举报失败，请稍后重试",
    };
  }
}
