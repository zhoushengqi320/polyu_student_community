import { NOTIFICATION_TYPES, type NotificationType } from "@/constants/moderation";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import { createNotification } from "@/lib/db/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function getPostDetailLink(postId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("posts")
    .select("module")
    .eq("id", postId)
    .maybeSingle();

  if (!data?.module) {
    return null;
  }

  switch (data.module) {
    case "forum":
      return ROUTES.forum.detail(postId);
    case "feedback":
      return ROUTES.feedback.detail(postId);
    case "study":
      return ROUTES.study.detail(postId);
    case "life":
      return ROUTES.life.detail(postId);
    case "guides":
      return ROUTES.guides.detail(postId);
    default:
      return null;
  }
}

async function resolveTargetLink(
  targetType: TargetType,
  targetId: string,
): Promise<string | null> {
  if (targetType === TARGET_TYPES.post) {
    return getPostDetailLink(targetId);
  }

  if (targetType === TARGET_TYPES.comment) {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const admin = createAdminClient();
    const { data } = await admin
      .from("comments")
      .select("target_id")
      .eq("id", targetId)
      .maybeSingle();
    if (!data?.target_id) {
      return null;
    }
    return getPostDetailLink(String(data.target_id));
  }

  if (targetType === TARGET_TYPES.course_review) {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const admin = createAdminClient();
    const { data } = await admin
      .from("course_reviews")
      .select("courses(code)")
      .eq("id", targetId)
      .maybeSingle();
    const course = data?.courses as { code?: string } | null;
    if (!course?.code) {
      return null;
    }
    return ROUTES.courses.detail(course.code);
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const admin = createAdminClient();
    const { data } = await admin
      .from("food_recommendations")
      .select("place_id")
      .eq("id", targetId)
      .maybeSingle();
    if (!data?.place_id) {
      return null;
    }
    return ROUTES.food.detail(String(data.place_id));
  }

  return null;
}

export async function notifyContentInteraction(input: {
  actorUserId: string;
  ownerUserId: string | null;
  targetType: TargetType;
  targetId: string;
  kind: "like" | "favorite" | "comment" | "reply";
}): Promise<void> {
  if (!input.ownerUserId || input.ownerUserId === input.actorUserId) {
    return;
  }

  const link = await resolveTargetLink(input.targetType, input.targetId);

  const titles: Record<typeof input.kind, string> = {
    like: "收到新的点赞",
    favorite: "收到新的收藏",
    comment: "收到新的评论",
    reply: "收到新的回复",
  };

  const bodies: Record<typeof input.kind, string> = {
    like: "有人赞了你的内容，点击查看详情。",
    favorite: "有人收藏了你的内容，点击查看详情。",
    comment: "有人评论了你的内容，点击查看详情。",
    reply: "有人回复了你的评论，点击查看详情。",
  };

  const types: Record<typeof input.kind, NotificationType> = {
    like: NOTIFICATION_TYPES.contentLiked,
    favorite: NOTIFICATION_TYPES.contentFavorited,
    comment: NOTIFICATION_TYPES.contentCommented,
    reply: NOTIFICATION_TYPES.contentReplied,
  };

  await createNotification({
    userId: input.ownerUserId,
    type: types[input.kind],
    title: titles[input.kind],
    body: bodies[input.kind],
    link,
    metadata: {
      targetType: input.targetType,
      targetId: input.targetId,
      actorUserId: input.actorUserId,
    },
  });
}
