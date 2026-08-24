import { NOTIFICATION_TYPES, type NotificationType } from "@/constants/moderation";
import {
  contentHighlightId,
  withContentHighlight,
  type ContentHighlightKind,
} from "@/constants/contentHighlight";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import { createNotification } from "@/lib/db/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function excerptOf(text: string | null | undefined, max = 48): string {
  const normalized = text?.replace(/\s+/g, " ").trim() ?? "";
  if (!normalized) {
    return "";
  }
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized;
}

function quoteTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    return "该内容";
  }
  return `「${trimmed}」`;
}

async function getActorDisplayName(actorUserId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return "某位同学";
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("approved_nickname, display_name, nickname, username")
    .eq("id", actorUserId)
    .maybeSingle();

  const name =
    data?.approved_nickname?.trim() ||
    data?.display_name?.trim() ||
    data?.nickname?.trim() ||
    data?.username?.trim();
  return name || "某位同学";
}

function postTypeLabel(module: string | null | undefined): string {
  switch (module) {
    case "forum":
      return "帖子";
    case "study":
      return "学习指南";
    case "life":
      return "生活指南";
    case "guides":
      return "入学攻略";
    case "feedback":
      return "反馈";
    default:
      return "内容";
  }
}

function postDetailPath(postId: string, module: string | null | undefined): string | null {
  switch (module) {
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

type TargetContext = {
  typeLabel: string;
  title: string;
  excerpt: string;
  link: string | null;
  highlightKind: ContentHighlightKind;
  highlightTargetId: string;
};

async function resolvePostContext(postId: string): Promise<TargetContext | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("posts")
    .select("id, title, excerpt, content, module")
    .eq("id", postId)
    .maybeSingle();
  if (!data) {
    return null;
  }
  const title = (data.title as string | null)?.trim() || excerptOf(data.excerpt as string);
  return {
    typeLabel: postTypeLabel(data.module as string | null),
    title: title || "未命名内容",
    excerpt: excerptOf((data.excerpt as string | null) ?? (data.content as string | null)),
    link: postDetailPath(postId, data.module as string | null),
    highlightKind: "post",
    highlightTargetId: postId,
  };
}

async function resolveTargetContext(
  targetType: TargetType,
  targetId: string,
): Promise<TargetContext | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createAdminClient();

  if (targetType === TARGET_TYPES.post) {
    return resolvePostContext(targetId);
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data } = await admin
      .from("comments")
      .select("id, content, target_id")
      .eq("id", targetId)
      .maybeSingle();
    if (!data?.target_id) {
      return null;
    }
    const parent = await resolvePostContext(String(data.target_id));
    return {
      typeLabel: "评论",
      title: parent?.title ?? "帖子",
      excerpt: excerptOf(data.content as string | null),
      link: parent?.link ?? null,
      highlightKind: "comment",
      highlightTargetId: targetId,
    };
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data } = await admin
      .from("course_reviews")
      .select("id, review_text, tips, courses(code, name)")
      .eq("id", targetId)
      .maybeSingle();
    const course = data?.courses as
      | { code?: string; name?: string | null }
      | { code?: string; name?: string | null }[]
      | null;
    const courseRow = Array.isArray(course) ? course[0] : course;
    if (!data || !courseRow?.code) {
      return null;
    }
    const courseName = courseRow.name?.trim() || courseRow.code;
    return {
      typeLabel: "课程评价",
      title: `${courseRow.code} ${courseName}`.trim(),
      excerpt: excerptOf((data.review_text as string | null) ?? (data.tips as string | null)),
      link: ROUTES.courses.detail(courseRow.code),
      highlightKind: "review",
      highlightTargetId: targetId,
    };
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data } = await admin
      .from("food_recommendations")
      .select("id, content, place_id")
      .eq("id", targetId)
      .maybeSingle();
    if (!data?.place_id) {
      return null;
    }
    const { data: place } = await admin
      .from("food_places")
      .select("name")
      .eq("id", data.place_id)
      .maybeSingle();
    return {
      typeLabel: "美食推荐",
      title: (place?.name as string | null)?.trim() || "餐厅推荐",
      excerpt: excerptOf(data.content as string | null),
      link: ROUTES.food.detail(String(data.place_id)),
      highlightKind: "rec",
      highlightTargetId: targetId,
    };
  }

  if (targetType === TARGET_TYPES.food_place) {
    const { data } = await admin
      .from("food_places")
      .select("id, name")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    return {
      typeLabel: "地点",
      title: (data.name as string | null)?.trim() || "地点",
      excerpt: "",
      link: ROUTES.food.detail(targetId),
      highlightKind: "place",
      highlightTargetId: targetId,
    };
  }

  if (targetType === TARGET_TYPES.market_listing) {
    const { data } = await admin
      .from("marketplace_listings")
      .select("id, title, description")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    return {
      typeLabel: "二手商品",
      title: (data.title as string | null)?.trim() || "商品",
      excerpt: excerptOf(data.description as string | null),
      link: ROUTES.market.detail(targetId),
      highlightKind: "listing",
      highlightTargetId: targetId,
    };
  }

  return null;
}

export async function notifyContentInteraction(input: {
  actorUserId: string;
  ownerUserId: string | null;
  targetType: TargetType;
  targetId: string;
  kind: "like" | "favorite" | "comment" | "reply";
  highlightId?: string;
  actorExcerpt?: string | null;
}): Promise<void> {
  if (!input.ownerUserId || input.ownerUserId === input.actorUserId) {
    return;
  }

  const [actorName, context] = await Promise.all([
    getActorDisplayName(input.actorUserId),
    resolveTargetContext(input.targetType, input.targetId),
  ]);

  const typeLabel = context?.typeLabel ?? "内容";
  const quotedTitle = quoteTitle(context?.title ?? "");
  const highlightId =
    input.highlightId ??
    (context
      ? contentHighlightId(context.highlightKind, context.highlightTargetId)
      : null);
  const link =
    context?.link && highlightId
      ? withContentHighlight(context.link, highlightId)
      : context?.link ?? null;

  const titles: Record<typeof input.kind, string> = {
    like:
      input.targetType === TARGET_TYPES.comment
        ? `${actorName} 点赞了你的评论`
        : `${actorName} 点赞了你的${typeLabel}${quotedTitle === "该内容" ? "" : quotedTitle}`,
    favorite:
      input.targetType === TARGET_TYPES.comment
        ? `${actorName} 收藏了你的评论`
        : `${actorName} 收藏了你的${typeLabel}${quotedTitle === "该内容" ? "" : quotedTitle}`,
    comment: `${actorName} 评论了你的${typeLabel}${quotedTitle === "该内容" ? "" : quotedTitle}`,
    reply: `${actorName} 回复了你的评论`,
  };

  const commentText = excerptOf(input.actorExcerpt);
  const bodies: Record<typeof input.kind, string> = {
    like:
      input.targetType === TARGET_TYPES.comment
        ? [context?.excerpt ? `你的评论：${context.excerpt}` : null, `来自${typeLabel}${quotedTitle}`]
            .filter(Boolean)
            .join("\n")
        : context?.excerpt || `查看你的${typeLabel}`,
    favorite:
      input.targetType === TARGET_TYPES.comment
        ? [context?.excerpt ? `你的评论：${context.excerpt}` : null, `来自${typeLabel}${quotedTitle}`]
            .filter(Boolean)
            .join("\n")
        : context?.excerpt || `查看你的${typeLabel}`,
    comment: commentText
      ? `评论内容：${commentText}`
      : `去看看这条${typeLabel}下的新评论`,
    reply: [
      commentText ? `回复内容：${commentText}` : null,
      context?.excerpt ? `你的评论：${context.excerpt}` : null,
      `来自${typeLabel}${quotedTitle}`,
    ]
      .filter(Boolean)
      .join("\n"),
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
      actorDisplayName: actorName,
      contentTitle: context?.title ?? null,
      contentTypeLabel: typeLabel,
      highlightId,
    },
  });
}
