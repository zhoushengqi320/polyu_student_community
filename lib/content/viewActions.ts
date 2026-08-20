"use server";

import { getSessionUser } from "@/lib/auth/session";
import { recordContentView } from "@/lib/db/contentViews";
import { getVisitorId } from "@/lib/guest/visitorId";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type TargetType } from "@/constants/reportReasons";
import { z } from "zod";

const viewSchema = z.object({
  targetType: z.enum([
    "post",
    "comment",
    "course",
    "course_review",
    "food_place",
    "food_recommendation",
    "buddy_post",
    "profile",
  ]),
  targetId: z.string().uuid(),
});

/** 详情页浏览打点：写入 content_views，不触发 revalidatePath */
export async function recordContentViewAction(input: {
  targetType: string;
  targetId: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const parsed = viewSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }

  try {
    const user = await getSessionUser();
    const visitorId = user ? null : await getVisitorId();

    await recordContentView({
      targetType: parsed.data.targetType as TargetType,
      targetId: parsed.data.targetId,
      userId: user?.id,
      visitorId,
    });
  } catch (error) {
    console.error("recordContentViewAction failed:", error);
  }
}
