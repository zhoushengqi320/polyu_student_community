import { DbError } from "@/lib/db/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type TargetType } from "@/constants/reportReasons";

export type ReactionType = "like" | "favorite";

/** migration 021 未执行时表不存在，避免反复 console.error 打断开发页 */
let guestReactionsUnavailable = false;
let guestReactionsMissingWarned = false;

function isMissingGuestReactionsTable(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null): boolean {
  if (!error) {
    return false;
  }
  const text =
    `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (text.includes("guest_reactions") &&
      (text.includes("does not exist") ||
        text.includes("could not find") ||
        text.includes("schema cache")))
  );
}

function warnGuestReactionsOnce(reason: string) {
  if (guestReactionsMissingWarned) {
    return;
  }
  guestReactionsMissingWarned = true;
  console.warn(
    `[guest_reactions] ${reason}。请在 Supabase SQL Editor 执行 supabase/migrations/021_guest_reactions.sql`,
  );
}

function markGuestReactionsUnavailable(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null): boolean {
  // 表未建时 PostgREST 有时返回几乎空的 error 对象；一律按不可用降级，避免开发红屏
  guestReactionsUnavailable = true;
  if (isMissingGuestReactionsTable(error) || !error?.message) {
    warnGuestReactionsOnce("表不存在或尚未同步到 API");
    return true;
  }
  warnGuestReactionsOnce(error.message);
  return true;
}

export async function toggleReaction(input: {
  userId: string;
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
}): Promise<"added" | "removed"> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", input.type)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("id", existing.id);

    if (error) {
      throw new DbError(error.message);
    }

    return "removed";
  }

  const { error } = await supabase.from("reactions").insert({
    user_id: input.userId,
    target_type: input.targetType,
    target_id: input.targetId,
    type: input.type,
  });

  if (error) {
    throw new DbError(error.message);
  }

  return "added";
}

/** 访客点赞：按 visitor_id 去重，刷新后仍保留，无法重复点赞 */
export async function toggleGuestReaction(input: {
  visitorId: string;
  targetType: TargetType;
  targetId: string;
}): Promise<"added" | "removed"> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  // 仅允许评论点赞；收藏等仍需登录
  if (input.targetType !== "comment") {
    throw new DbError("访客仅可对评论点赞", "VALIDATION");
  }

  if (guestReactionsUnavailable) {
    throw new DbError(
      "访客点赞尚未启用：请先在数据库执行 021_guest_reactions.sql",
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    throw new DbError("访客点赞暂不可用，请稍后重试或登录后点赞");
  }

  const { data: existing, error: existingError } = await admin
    .from("guest_reactions")
    .select("id")
    .eq("visitor_id", input.visitorId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", "like")
    .maybeSingle();

  if (existingError) {
    if (markGuestReactionsUnavailable(existingError)) {
      throw new DbError(
        "访客点赞尚未启用：请先在数据库执行 021_guest_reactions.sql",
      );
    }
    throw new DbError(existingError.message);
  }

  if (existing) {
    const { error } = await admin
      .from("guest_reactions")
      .delete()
      .eq("id", existing.id);

    if (error) {
      throw new DbError(error.message);
    }

    return "removed";
  }

  const { error } = await admin.from("guest_reactions").insert({
    visitor_id: input.visitorId,
    target_type: input.targetType,
    target_id: input.targetId,
    type: "like",
  });

  if (error) {
    // 唯一约束冲突：视为已点赞（并发请求）
    if (error.code === "23505") {
      return "added";
    }
    if (markGuestReactionsUnavailable(error)) {
      throw new DbError(
        "访客点赞尚未启用：请先在数据库执行 021_guest_reactions.sql",
      );
    }
    throw new DbError(error.message);
  }

  return "added";
}

export async function hasReaction(input: {
  userId: string;
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", input.type)
    .maybeSingle();

  return Boolean(data);
}

export async function countReactions(input: {
  targetType: TargetType;
  targetId: string;
  type: ReactionType;
}): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", input.type);

  if (error) {
    console.error("Failed to count reactions:", error);
    return 0;
  }

  let total = count ?? 0;

  if (input.type === "like" && !guestReactionsUnavailable) {
    const { count: guestCount, error: guestError } = await supabase
      .from("guest_reactions")
      .select("*", { count: "exact", head: true })
      .eq("target_type", input.targetType)
      .eq("target_id", input.targetId)
      .eq("type", "like");

    if (guestError) {
      markGuestReactionsUnavailable(guestError);
    } else {
      total += guestCount ?? 0;
    }
  }

  return total;
}

export type ReactionSummary = {
  count: number;
  isLiked: boolean;
};

export async function getReactionSummariesForTargets(input: {
  targetType: TargetType;
  targetIds: string[];
  userId?: string;
  visitorId?: string;
  type?: ReactionType;
}): Promise<Map<string, ReactionSummary>> {
  const summaries = new Map<string, ReactionSummary>();
  const uniqueIds = [...new Set(input.targetIds.filter(Boolean))];
  const type = input.type ?? "like";

  for (const targetId of uniqueIds) {
    summaries.set(targetId, { count: 0, isLiked: false });
  }

  if (uniqueIds.length === 0 || !isSupabaseConfigured()) {
    return summaries;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reactions")
    .select("target_id, user_id")
    .eq("target_type", input.targetType)
    .eq("type", type)
    .in("target_id", uniqueIds);

  if (error) {
    console.error("Failed to get reaction summaries:", error);
  } else {
    for (const row of (data ?? []) as Array<{ target_id: string; user_id: string }>) {
      const current = summaries.get(row.target_id);
      if (!current) {
        continue;
      }
      current.count += 1;
      if (input.userId && row.user_id === input.userId) {
        current.isLiked = true;
      }
    }
  }

  if (type === "like" && !guestReactionsUnavailable) {
    const { data: guestData, error: guestError } = await supabase
      .from("guest_reactions")
      .select("target_id, visitor_id")
      .eq("target_type", input.targetType)
      .eq("type", "like")
      .in("target_id", uniqueIds);

    if (guestError) {
      markGuestReactionsUnavailable(guestError);
    } else {
      for (const row of (guestData ?? []) as Array<{
        target_id: string;
        visitor_id: string;
      }>) {
        const current = summaries.get(row.target_id);
        if (!current) {
          continue;
        }
        current.count += 1;
        if (!input.userId && input.visitorId && row.visitor_id === input.visitorId) {
          current.isLiked = true;
        }
      }
    }
  }

  return summaries;
}
