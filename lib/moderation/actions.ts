"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { requestArchiveAppeal } from "@/lib/moderation/reportWorkflow";

const APPEALABLE_TARGET_TYPES = [
  TARGET_TYPES.post,
  TARGET_TYPES.comment,
  TARGET_TYPES.course_review,
  TARGET_TYPES.food_place,
  TARGET_TYPES.food_recommendation,
] as const;

const appealSchema = z.object({
  targetType: z.enum(APPEALABLE_TARGET_TYPES),
  targetId: z.string().uuid(),
  appealNote: z
    .string()
    .trim()
    .min(5, "申诉理由至少 5 个字")
    .max(1000, "申诉理由不能超过 1000 字"),
});

export type ArchiveAppealActionState = {
  error?: string;
  success?: string;
};

export async function requestArchiveAppealAction(
  _prevState: ArchiveAppealActionState,
  formData: FormData,
): Promise<ArchiveAppealActionState> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "请先登录" };
  }

  const parsed = appealSchema.safeParse({
    targetType: String(formData.get("targetType") ?? ""),
    targetId: String(formData.get("targetId") ?? ""),
    appealNote: String(formData.get("appealNote") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "申诉参数无效",
    };
  }

  try {
    await requestArchiveAppeal({
      targetType: parsed.data.targetType as TargetType,
      targetId: parsed.data.targetId,
      userId: user.id,
      appealNote: parsed.data.appealNote,
    });
    revalidatePath(ROUTES.notifications);
    revalidatePath(ROUTES.profile(user.id));
    revalidatePath(ROUTES.admin);
    return { success: "申诉已提交，等待管理员审核" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "申诉失败，请稍后重试",
    };
  }
}
