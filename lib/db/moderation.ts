import { CONTENT_STATUS } from "@/constants/contentStatus";
import { ARCHIVE_APPEAL_STATUS } from "@/constants/moderation";
import { REPORT_STATUS, TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import { DbError } from "@/lib/db/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const OPEN_REPORT_STATUSES = [
  REPORT_STATUS.pending,
  REPORT_STATUS.reviewing,
  REPORT_STATUS.reviewed,
] as const;

/**
 * 治理写/跨用户读必须跳过 RLS（举报人无法改他人帖、也无法看到他人举报）。
 * 优先 service role；未配置时回退登录态（仅管理员会话可用）。
 */
async function getModerationClient() {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

export async function countDistinctReporters(
  targetType: TargetType,
  targetId: string,
): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await getModerationClient();
  const { data, error } = await supabase
    .from("reports")
    .select("reporter_id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .in("status", [...OPEN_REPORT_STATUSES]);

  if (error || !data) {
    return 0;
  }

  return new Set(data.map((row: { reporter_id: string }) => row.reporter_id)).size;
}

export async function getContentOwnerId(
  targetType: TargetType,
  targetId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await getModerationClient();

  if (targetType === TARGET_TYPES.post) {
    const { data } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data } = await supabase
      .from("course_reviews")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data } = await supabase
      .from("food_recommendations")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  if (targetType === TARGET_TYPES.market_listing) {
    const { data } = await supabase
      .from("marketplace_listings")
      .select("user_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.user_id ?? null;
  }

  if (targetType === TARGET_TYPES.message) {
    const { data } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("id", targetId)
      .maybeSingle();
    return data?.sender_id ?? null;
  }

  return null;
}

export async function hideContentByTarget(
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await getModerationClient();

  if (targetType === TARGET_TYPES.post) {
    const { data, error } = await supabase
      .from("posts")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data, error } = await supabase
      .from("comments")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data, error } = await supabase
      .from("course_reviews")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_place) {
    const { data, error } = await supabase
      .from("food_places")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data, error } = await supabase
      .from("food_recommendations")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.market_listing) {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.message) {
    const { data, error } = await supabase
      .from("messages")
      .update({
        moderation_hidden_at: new Date().toISOString(),
        appeal_status: ARCHIVE_APPEAL_STATUS.none,
        appeal_note: null,
        appeal_submitted_at: null,
      })
      .eq("id", targetId)
      .is("moderation_hidden_at", null)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  throw new DbError("暂不支持隐藏该类型内容");
}

export async function restoreContentByTarget(
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await getModerationClient();

  if (targetType === TARGET_TYPES.post) {
    const { data, error } = await supabase
      .from("posts")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data, error } = await supabase
      .from("comments")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data, error } = await supabase
      .from("course_reviews")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_place) {
    const { data, error } = await supabase
      .from("food_places")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data, error } = await supabase
      .from("food_recommendations")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.market_listing) {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .eq("status", CONTENT_STATUS.hidden)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.message) {
    const { data, error } = await supabase
      .from("messages")
      .update({
        moderation_hidden_at: null,
        appeal_status: ARCHIVE_APPEAL_STATUS.none,
      })
      .eq("id", targetId)
      .not("moderation_hidden_at", "is", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  return false;
}

export async function listOpenReporterIdsForTarget(
  targetType: TargetType,
  targetId: string,
): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await getModerationClient();
  const { data, error } = await supabase
    .from("reports")
    .select("reporter_id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .in("status", [...OPEN_REPORT_STATUSES]);

  if (error || !data) {
    return [];
  }

  return [
    ...new Set(
      (data as Array<{ reporter_id: string }>).map((row) => row.reporter_id),
    ),
  ];
}

export async function countPriorResolvedReports(
  targetType: TargetType,
  targetId: string,
): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await getModerationClient();
  const { count, error } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", REPORT_STATUS.resolved);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export type ContentSnapshot = {
  title: string | null;
  body: string | null;
  excerpt: string | null;
  module: string | null;
  ownerId: string | null;
  deletedAt: string | null;
  status: string | null;
  raw: Record<string, unknown>;
};

function excerptOf(text: string | null | undefined, max = 280): string | null {
  if (!text) {
    return null;
  }
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }
  return normalized.length > max
    ? `${normalized.slice(0, max)}…`
    : normalized;
}

/** 读取内容快照（含已删除），供后台预览与封存。 */
export async function getContentSnapshot(
  targetType: TargetType,
  targetId: string,
): Promise<ContentSnapshot | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await getModerationClient();

  if (targetType === TARGET_TYPES.post) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, content, module, user_id, status, deleted_at")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    const row = data as {
      title: string;
      content: string;
      module: string;
      user_id: string;
      status: string;
      deleted_at: string | null;
    };
    return {
      title: row.title,
      body: row.content,
      excerpt: excerptOf(row.content),
      module: row.module,
      ownerId: row.user_id,
      deletedAt: row.deleted_at,
      status: row.status,
      raw: row as unknown as Record<string, unknown>,
    };
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data } = await supabase
      .from("comments")
      .select("id, content, user_id, post_id, status, deleted_at")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    const row = data as {
      content: string;
      user_id: string;
      post_id: string;
      status: string;
      deleted_at: string | null;
    };
    return {
      title: null,
      body: row.content,
      excerpt: excerptOf(row.content),
      module: null,
      ownerId: row.user_id,
      deletedAt: row.deleted_at,
      status: row.status,
      raw: row as unknown as Record<string, unknown>,
    };
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data } = await supabase
      .from("course_reviews")
      .select("id, content, review_text, user_id, course_id, status, deleted_at")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    const row = data as {
      content: string | null;
      review_text?: string | null;
      user_id: string;
      course_id: string;
      status: string;
      deleted_at: string | null;
    };
    const body = row.review_text ?? row.content;
    return {
      title: null,
      body,
      excerpt: excerptOf(body),
      module: null,
      ownerId: row.user_id,
      deletedAt: row.deleted_at,
      status: row.status,
      raw: row as unknown as Record<string, unknown>,
    };
  }

  if (targetType === TARGET_TYPES.food_place) {
    const { data } = await supabase
      .from("food_places")
      .select("id, name, address, area, status")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    const row = data as {
      name: string;
      address: string | null;
      area: string;
      status: string;
    };
    const body = [row.area, row.address].filter(Boolean).join(" · ") || null;
    return {
      title: row.name,
      body,
      excerpt: excerptOf(body),
      module: null,
      ownerId: null,
      deletedAt: null,
      status: row.status,
      raw: row as unknown as Record<string, unknown>,
    };
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data } = await supabase
      .from("food_recommendations")
      .select("id, content, user_id, place_id, status, deleted_at")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    const row = data as {
      content: string;
      user_id: string;
      place_id: string;
      status: string;
      deleted_at: string | null;
    };
    return {
      title: null,
      body: row.content,
      excerpt: excerptOf(row.content),
      module: null,
      ownerId: row.user_id,
      deletedAt: row.deleted_at,
      status: row.status,
      raw: row as unknown as Record<string, unknown>,
    };
  }

  if (targetType === TARGET_TYPES.market_listing) {
    const { data } = await supabase
      .from("marketplace_listings")
      .select(
        "id, title, description, user_id, price_hkd, category, status, deleted_at",
      )
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    const row = data as {
      title: string;
      description: string;
      user_id: string;
      price_hkd: number;
      category: string;
      status: string;
      deleted_at: string | null;
    };
    return {
      title: row.title,
      body: row.description,
      excerpt: excerptOf(row.description),
      module: "market",
      ownerId: row.user_id,
      deletedAt: row.deleted_at,
      status: row.status,
      raw: row as unknown as Record<string, unknown>,
    };
  }

  if (targetType === TARGET_TYPES.message) {
    const { data } = await supabase
      .from("messages")
      .select(
        "id, body, sender_id, conversation_id, content_type, attachment_urls, attachment_mime_types, created_at, deleted_at, moderation_hidden_at",
      )
      .eq("id", targetId)
      .maybeSingle();
    if (!data) {
      return null;
    }
    const row = data as {
      body: string | null;
      sender_id: string;
      conversation_id: string;
      content_type: string;
      attachment_urls: string[];
      attachment_mime_types: string[];
      created_at: string;
      deleted_at: string | null;
      moderation_hidden_at: string | null;
    };
    const attachmentNote =
      row.attachment_urls.length > 0
        ? `[附件 ${row.attachment_urls.length} 个]`
        : null;
    const body = [row.body?.trim(), attachmentNote].filter(Boolean).join("\n");
    return {
      title: "私信消息",
      body: body || null,
      excerpt: excerptOf(body),
      module: "message",
      ownerId: row.sender_id,
      deletedAt: row.deleted_at,
      status: row.moderation_hidden_at
        ? CONTENT_STATUS.hidden
        : CONTENT_STATUS.published,
      raw: row as unknown as Record<string, unknown>,
    };
  }

  return null;
}

/** 软删除目标内容（写入 deleted_at + hidden）。 */
export async function softDeleteContentByTarget(
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await getModerationClient();
  const deletedAt = new Date().toISOString();

  if (targetType === TARGET_TYPES.post) {
    const { data, error } = await supabase
      .from("posts")
      .update({ deleted_at: deletedAt, status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data, error } = await supabase
      .from("comments")
      .update({ deleted_at: deletedAt, status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data, error } = await supabase
      .from("course_reviews")
      .update({ deleted_at: deletedAt, status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data, error } = await supabase
      .from("food_recommendations")
      .update({ deleted_at: deletedAt, status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_place) {
    const { data, error } = await supabase
      .from("food_places")
      .update({ status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.market_listing) {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .update({ deleted_at: deletedAt, status: CONTENT_STATUS.hidden })
      .eq("id", targetId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  throw new DbError("暂不支持软删除该类型内容");
}

/** 从封存恢复：清除 deleted_at 并设为 published（地点仅恢复 published）。 */
export async function restoreSoftDeletedContentByTarget(
  targetType: TargetType,
  targetId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await getModerationClient();

  if (targetType === TARGET_TYPES.post) {
    const { data, error } = await supabase
      .from("posts")
      .update({ deleted_at: null, status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.comment) {
    const { data, error } = await supabase
      .from("comments")
      .update({ deleted_at: null, status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.course_review) {
    const { data, error } = await supabase
      .from("course_reviews")
      .update({ deleted_at: null, status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_recommendation) {
    const { data, error } = await supabase
      .from("food_recommendations")
      .update({ deleted_at: null, status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.food_place) {
    const { data, error } = await supabase
      .from("food_places")
      .update({ status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  if (targetType === TARGET_TYPES.market_listing) {
    const { data, error } = await supabase
      .from("marketplace_listings")
      .update({ deleted_at: null, status: CONTENT_STATUS.published })
      .eq("id", targetId)
      .select("id")
      .maybeSingle();
    if (error) {
      throw new DbError(error.message);
    }
    return Boolean(data);
  }

  return false;
}
