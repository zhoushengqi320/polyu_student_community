import { DbError } from "@/lib/db/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type TargetType } from "@/constants/reportReasons";

export type ContentEngagementUser = {
  id: string;
  displayName: string;
  username: string | null;
  isVisitor: boolean;
  at: string;
};

function resolveDisplayName(row: {
  approved_nickname?: string | null;
  display_name?: string | null;
  nickname?: string | null;
  username?: string | null;
}): string {
  return (
    row.approved_nickname ||
    row.display_name ||
    row.nickname ||
    row.username ||
    "未知用户"
  );
}

/** 记录一次浏览（登录用户或访客）；同一主体只保留一条并刷新 last_viewed_at */
export async function recordContentView(input: {
  targetType: TargetType;
  targetId: string;
  userId?: string | null;
  visitorId?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const userId = input.userId?.trim() || null;
  const visitorId = userId ? null : input.visitorId?.trim() || null;
  if (!userId && !visitorId) {
    return;
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (userId) {
    const { data: existing } = await admin
      .from("content_views")
      .select("id")
      .eq("target_type", input.targetType)
      .eq("target_id", input.targetId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.id) {
      await admin
        .from("content_views")
        .update({ last_viewed_at: now })
        .eq("id", existing.id);
      return;
    }

    const { error } = await admin.from("content_views").insert({
      target_type: input.targetType,
      target_id: input.targetId,
      user_id: userId,
      visitor_id: null,
      last_viewed_at: now,
    });
    if (error) {
      console.error("Failed to record content view:", error.message);
    }
    return;
  }

  const { data: existing } = await admin
    .from("content_views")
    .select("id")
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("visitor_id", visitorId!)
    .is("user_id", null)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("content_views")
      .update({ last_viewed_at: now })
      .eq("id", existing.id);
    return;
  }

  const { error } = await admin.from("content_views").insert({
    target_type: input.targetType,
    target_id: input.targetId,
    user_id: null,
    visitor_id: visitorId,
    last_viewed_at: now,
  });

  if (error) {
    console.error("Failed to record visitor content view:", error.message);
  }
}

export async function listReactionUsersForAdmin(input: {
  targetType: TargetType;
  targetId: string;
  type: "like" | "favorite";
  limit?: number;
}): Promise<ContentEngagementUser[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createAdminClient();
  const limit = input.limit ?? 100;

  const { data, error } = await admin
    .from("reactions")
    .select(
      "user_id, created_at, profiles:user_id(username, display_name, approved_nickname, nickname)",
    )
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("type", input.type)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new DbError(error.message);
  }

  return ((data ?? []) as Array<{
    user_id: string;
    created_at: string;
    profiles?: {
      username?: string | null;
      display_name?: string | null;
      approved_nickname?: string | null;
      nickname?: string | null;
    } | null;
  }>).map((row) => {
    const profile = row.profiles ?? {};
    return {
      id: String(row.user_id),
      displayName: resolveDisplayName(profile),
      username: profile.username ?? null,
      isVisitor: false,
      at: String(row.created_at),
    };
  });
}

export async function listContentViewersForAdmin(input: {
  targetType: TargetType;
  targetId: string;
  limit?: number;
}): Promise<ContentEngagementUser[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createAdminClient();
  const limit = input.limit ?? 100;

  const { data, error } = await admin
    .from("content_views")
    .select(
      "id, user_id, visitor_id, last_viewed_at, profiles:user_id(username, display_name, approved_nickname, nickname)",
    )
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .order("last_viewed_at", { ascending: false })
    .limit(limit);

  if (error) {
    // 迁移未执行时降级为空，避免后台预览整体失败
    if (
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      String(error.message).includes("content_views")
    ) {
      return [];
    }
    throw new DbError(error.message);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    user_id: string | null;
    visitor_id: string | null;
    last_viewed_at: string;
    profiles?: {
      username?: string | null;
      display_name?: string | null;
      approved_nickname?: string | null;
      nickname?: string | null;
    } | null;
  }>;

  return rows.map((row) => {
    if (row.user_id) {
      const profile = row.profiles ?? {};
      return {
        id: String(row.user_id),
        displayName: resolveDisplayName(profile),
        username: profile.username ?? null,
        isVisitor: false,
        at: String(row.last_viewed_at),
      };
    }

    const visitorId = String(row.visitor_id ?? row.id);
    return {
      id: visitorId,
      displayName: `访客 ${visitorId.slice(0, 8)}`,
      username: null,
      isVisitor: true,
      at: String(row.last_viewed_at),
    };
  });
}
