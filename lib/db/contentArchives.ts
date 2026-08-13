import {
  ARCHIVE_APPEAL_STATUS,
  type ArchiveAppealStatus,
} from "@/constants/moderation";
import { type TargetType } from "@/constants/reportReasons";
import { softDeleteContentByTarget } from "@/lib/db/moderation";
import { logAdminAction } from "@/lib/db/reports";
import { DbError } from "@/lib/db/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ContentArchiveSnapshot = {
  owner_id?: string | null;
  title?: string | null;
  content?: string | null;
  module?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

export type ContentArchiveRow = {
  id: string;
  target_type: string;
  target_id: string;
  module: string | null;
  title: string | null;
  snapshot: ContentArchiveSnapshot;
  archived_by: string | null;
  archived_at: string;
  appeal_deadline: string;
  restored_at: string | null;
  restored_by: string | null;
  appeal_note: string | null;
  appeal_status: ArchiveAppealStatus;
  appeal_submitted_at: string | null;
  expired_at: string | null;
};

function asArchiveRow(data: unknown): ContentArchiveRow {
  const row = data as ContentArchiveRow & {
    appeal_status?: string | null;
  };
  return {
    ...row,
    appeal_status:
      (row.appeal_status as ArchiveAppealStatus | null | undefined) ??
      ARCHIVE_APPEAL_STATUS.none,
    appeal_submitted_at: row.appeal_submitted_at ?? null,
    expired_at: row.expired_at ?? null,
  };
}

async function withAdminFallback<T>(
  adminFn: (admin: ReturnType<typeof createAdminClient>) => Promise<T>,
  userFn: (
    supabase: Awaited<ReturnType<typeof createClient>>,
  ) => Promise<T>,
): Promise<T> {
  try {
    const admin = createAdminClient();
    return await adminFn(admin);
  } catch (error) {
    if (error instanceof DbError) {
      throw error;
    }
    const supabase = await createClient();
    return userFn(supabase);
  }
}

export async function insertContentArchive(input: {
  targetType: TargetType;
  targetId: string;
  module?: string | null;
  title?: string | null;
  snapshot: ContentArchiveSnapshot;
  archivedBy: string | null;
  appealDeadline: string;
}): Promise<ContentArchiveRow> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const payload = {
    target_type: input.targetType,
    target_id: input.targetId,
    module: input.module ?? null,
    title: input.title ?? null,
    snapshot: input.snapshot,
    archived_by: input.archivedBy,
    appeal_deadline: input.appealDeadline,
    appeal_status: ARCHIVE_APPEAL_STATUS.none,
  };

  return withAdminFallback(
    async (admin) => {
      const { data, error } = await admin
        .from("content_archives")
        .insert(payload)
        .select("*")
        .single();
      if (error || !data) {
        throw new DbError(error?.message ?? "封存内容失败");
      }
      return asArchiveRow(data);
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("content_archives")
        .insert(payload)
        .select("*")
        .single();
      if (error || !data) {
        throw new DbError(error?.message ?? "封存内容失败");
      }
      return asArchiveRow(data);
    },
  );
}

/** 若目标尚无有效封存记录则复制一份；已有则返回现有记录。 */
export async function ensureContentArchived(input: {
  targetType: TargetType;
  targetId: string;
  module?: string | null;
  title?: string | null;
  snapshot: ContentArchiveSnapshot;
  archivedBy: string | null;
  appealDeadline: string;
}): Promise<{ archive: ContentArchiveRow; created: boolean }> {
  const existing = await getActiveArchiveForTarget(
    input.targetType,
    input.targetId,
  );
  if (existing) {
    return { archive: existing, created: false };
  }

  const archive = await insertContentArchive(input);
  return { archive, created: true };
}

export async function getActiveArchiveForTarget(
  targetType: TargetType,
  targetId: string,
): Promise<ContentArchiveRow | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return withAdminFallback(
    async (admin) => {
      const { data, error } = await admin
        .from("content_archives")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .is("restored_at", null)
        .is("expired_at", null)
        .order("archived_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new DbError(error.message);
      }
      return data ? asArchiveRow(data) : null;
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("content_archives")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .is("restored_at", null)
        .is("expired_at", null)
        .order("archived_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new DbError(error.message);
      }
      return data ? asArchiveRow(data) : null;
    },
  );
}

export async function listActiveArchivesByOwner(
  ownerId: string,
): Promise<ContentArchiveRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  return withAdminFallback(
    async (admin) => {
      const { data, error } = await admin
        .from("content_archives")
        .select("*")
        .is("restored_at", null)
        .is("expired_at", null)
        .contains("snapshot", { owner_id: ownerId })
        .order("archived_at", { ascending: false });

      if (error) {
        // JSON contains 可能因类型失败；回退过滤
        const fallback = await admin
          .from("content_archives")
          .select("*")
          .is("restored_at", null)
          .is("expired_at", null)
          .order("archived_at", { ascending: false })
          .limit(200);
        if (fallback.error) {
          throw new DbError(fallback.error.message);
        }
        return ((fallback.data ?? []) as unknown[])
          .map(asArchiveRow)
          .filter((row) => row.snapshot?.owner_id === ownerId);
      }

      return ((data ?? []) as unknown[]).map(asArchiveRow);
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("content_archives")
        .select("*")
        .is("restored_at", null)
        .is("expired_at", null)
        .order("archived_at", { ascending: false })
        .limit(200);

      if (error) {
        throw new DbError(error.message);
      }

      return ((data ?? []) as unknown[])
        .map(asArchiveRow)
        .filter((row) => row.snapshot?.owner_id === ownerId);
    },
  );
}

export async function listActiveContentArchives(
  limit = 100,
): Promise<ContentArchiveRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  return withAdminFallback(
    async (admin) => {
      const { data, error } = await admin
        .from("content_archives")
        .select("*")
        .is("restored_at", null)
        .is("expired_at", null)
        .order("archived_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new DbError(error.message);
      }
      return ((data ?? []) as unknown[]).map(asArchiveRow);
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("content_archives")
        .select("*")
        .is("restored_at", null)
        .is("expired_at", null)
        .order("archived_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new DbError(error.message);
      }
      return ((data ?? []) as unknown[]).map(asArchiveRow);
    },
  );
}

export async function listPendingArchiveAppeals(
  limit = 100,
): Promise<ContentArchiveRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  return withAdminFallback(
    async (admin) => {
      const { data, error } = await admin
        .from("content_archives")
        .select("*")
        .eq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
        .is("restored_at", null)
        .is("expired_at", null)
        .order("appeal_submitted_at", { ascending: true })
        .limit(limit);

      if (error) {
        throw new DbError(error.message);
      }
      return ((data ?? []) as unknown[]).map(asArchiveRow);
    },
    async (supabase) => {
      const { data, error } = await supabase
        .from("content_archives")
        .select("*")
        .eq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
        .is("restored_at", null)
        .is("expired_at", null)
        .order("appeal_submitted_at", { ascending: true })
        .limit(limit);

      if (error) {
        throw new DbError(error.message);
      }
      return ((data ?? []) as unknown[]).map(asArchiveRow);
    },
  );
}

export async function submitArchiveAppeal(input: {
  archiveId: string;
  appealNote: string;
}): Promise<ContentArchiveRow> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_archives")
    .update({
      appeal_status: ARCHIVE_APPEAL_STATUS.pending,
      appeal_note: input.appealNote,
      appeal_submitted_at: now,
    })
    .eq("id", input.archiveId)
    .is("restored_at", null)
    .is("expired_at", null)
    .in("appeal_status", [
      ARCHIVE_APPEAL_STATUS.none,
      ARCHIVE_APPEAL_STATUS.rejected,
    ])
    .select("*")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("封存记录不存在或已提交申诉", "VALIDATION");
  }

  return asArchiveRow(data);
}

export async function markArchiveRestored(input: {
  archiveId: string;
  restoredBy: string;
  appealNote?: string | null;
  appealStatus?: ArchiveAppealStatus;
}): Promise<ContentArchiveRow> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_archives")
    .update({
      restored_at: now,
      restored_by: input.restoredBy,
      appeal_note: input.appealNote ?? null,
      appeal_status:
        input.appealStatus ?? ARCHIVE_APPEAL_STATUS.approved,
    })
    .eq("id", input.archiveId)
    .is("restored_at", null)
    .is("expired_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("封存记录不存在或已恢复", "VALIDATION");
  }

  return asArchiveRow(data);
}

export async function deleteArchiveEntry(archiveId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("content_archives")
    .delete()
    .eq("id", archiveId);

  if (error) {
    throw new DbError(error.message);
  }
}

export async function rejectArchiveAppeal(input: {
  archiveId: string;
  adminId: string;
}): Promise<ContentArchiveRow> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_archives")
    .update({
      appeal_status: ARCHIVE_APPEAL_STATUS.rejected,
    })
    .eq("id", input.archiveId)
    .eq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
    .is("restored_at", null)
    .is("expired_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("申诉不存在或已处理", "VALIDATION");
  }

  void input.adminId;
  return asArchiveRow(data);
}

export async function markArchiveExpired(input: {
  archiveId: string;
}): Promise<ContentArchiveRow> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_archives")
    .update({ expired_at: now })
    .eq("id", input.archiveId)
    .is("restored_at", null)
    .is("expired_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new DbError(error.message);
  }
  if (!data) {
    throw new DbError("封存记录不存在或已失效", "VALIDATION");
  }

  return asArchiveRow(data);
}

/** 到期封存：软删除原文、写入操作日志备份、从活跃封存列表移除。 */
export async function expireDueArchives(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const nowIso = new Date().toISOString();
  let due: ContentArchiveRow[] = [];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("content_archives")
      .select("*")
      .is("restored_at", null)
      .is("expired_at", null)
      .neq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
      .lt("appeal_deadline", nowIso)
      .limit(100);

    if (error) {
      throw new DbError(error.message);
    }
    due = ((data ?? []) as unknown[]).map(asArchiveRow);
  } catch {
    return 0;
  }

  let expiredCount = 0;

  for (const archive of due) {
    try {
      await softDeleteContentByTarget(
        archive.target_type as TargetType,
        archive.target_id,
      );

      await logAdminAction({
        adminId: null,
        action: "archive_expired_permanent",
        targetType: archive.target_type as TargetType,
        targetId: archive.target_id,
        metadata: {
          archiveId: archive.id,
          title: archive.title,
          module: archive.module,
          appealDeadline: archive.appeal_deadline,
          appealStatus: archive.appeal_status,
          appealNote: archive.appeal_note,
          contentBackup: archive.snapshot,
          archivedAt: archive.archived_at,
          expiredAt: nowIso,
        },
      });

      await markArchiveExpired({ archiveId: archive.id });
      expiredCount += 1;
    } catch (error) {
      console.error("Failed to expire archive:", archive.id, error);
    }
  }

  return expiredCount;
}
