import { TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import { getLatestArchiveForTarget } from "@/lib/db/contentArchives";
import { getContentSnapshot } from "@/lib/db/moderation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const CONTENT_TARGET_TYPES = new Set<string>([
  TARGET_TYPES.post,
  TARGET_TYPES.comment,
  TARGET_TYPES.course_review,
  TARGET_TYPES.food_place,
  TARGET_TYPES.food_recommendation,
  TARGET_TYPES.course,
  TARGET_TYPES.buddy_post,
  TARGET_TYPES.profile,
]);

export type AdminActionLogDetailSource =
  | "metadata"
  | "database"
  | "archive"
  | "profile"
  | "mixed"
  | "none";

export type AdminActionLogDetail = {
  title: string | null;
  excerpt: string | null;
  reason: string | null;
  appealNote: string | null;
  body: string | null;
  module: string | null;
  status: string | null;
  deletedAt: string | null;
  authorName: string | null;
  profileSnapshot: Record<string, unknown> | null;
  source: AdminActionLogDetailSource;
  sourceNote: string | null;
};

function readMetaString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBackupBody(
  backup: unknown,
): { body: string | null; title: string | null; module: string | null } {
  if (!backup || typeof backup !== "object") {
    return { body: null, title: null, module: null };
  }

  const record = backup as Record<string, unknown>;
  const body =
    typeof record.content === "string"
      ? record.content
      : typeof record.review_text === "string"
        ? record.review_text
        : null;
  const title = typeof record.title === "string" ? record.title : null;
  const contentModule =
    typeof record.module === "string" ? record.module : null;

  return { body, title, module: contentModule };
}

function isContentTargetType(targetType: string): targetType is TargetType {
  return CONTENT_TARGET_TYPES.has(targetType);
}

async function resolveAuthorName(ownerId: string | null): Promise<string | null> {
  if (!ownerId || !isSupabaseConfigured()) {
    return null;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("username, display_name, approved_nickname, nickname")
      .eq("id", ownerId)
      .maybeSingle();

    if (!profile) {
      return null;
    }

    return (
      (profile.approved_nickname as string | null) ||
      (profile.display_name as string | null) ||
      (profile.nickname as string | null) ||
      (profile.username as string | null) ||
      null
    );
  } catch {
    return null;
  }
}

async function resolveProfileDetail(
  userId: string,
  metadata: Record<string, unknown> | null | undefined,
): Promise<Partial<AdminActionLogDetail>> {
  const profileSnapshot =
    metadata?.profileSnapshot && typeof metadata.profileSnapshot === "object"
      ? (metadata.profileSnapshot as Record<string, unknown>)
      : null;

  if (profileSnapshot) {
    const nickname =
      typeof profileSnapshot.nickname === "string"
        ? profileSnapshot.nickname
        : null;
    return {
      title: nickname ? `昵称：${nickname}` : "用户资料",
      excerpt: profileSnapshot.avatarUrl ? "含头像变更" : null,
      profileSnapshot,
      source: "metadata",
    };
  }

  if (!isSupabaseConfigured()) {
    return {};
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("nickname, avatar_url, display_name, username")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return {};
    }

    const nickname =
      (profile.nickname as string | null) ||
      (profile.display_name as string | null) ||
      (profile.username as string | null);
    const snapshot = {
      nickname,
      avatarUrl: (profile.avatar_url as string | null) ?? null,
      username: (profile.username as string | null) ?? null,
    };

    return {
      title: nickname ? `昵称：${nickname}` : "用户资料",
      excerpt: snapshot.avatarUrl ? "含头像变更" : null,
      profileSnapshot: snapshot,
      source: "profile",
      sourceNote: "自用户资料补查（历史记录未写入快照）",
    };
  } catch {
    return {};
  }
}

/** 合并 metadata、数据库与封存库，补全历史操作记录详情。 */
export async function resolveAdminActionLogDetail(input: {
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null | undefined;
}): Promise<AdminActionLogDetail> {
  const metadata = input.metadata;
  const reason = readMetaString(metadata, "reason");
  const appealNote = readMetaString(metadata, "appealNote");

  let title =
    readMetaString(metadata, "title") ?? readMetaString(metadata, "targetLabel");
  let excerpt = readMetaString(metadata, "excerpt");
  let contentModule = readMetaString(metadata, "module");
  let body: string | null = null;
  let status: string | null = null;
  let deletedAt: string | null = null;
  let authorName: string | null = null;
  let profileSnapshot: Record<string, unknown> | null = null;

  const backupFromMeta = readBackupBody(metadata?.contentBackup);
  body = backupFromMeta.body;
  title = title ?? backupFromMeta.title;
  contentModule = contentModule ?? backupFromMeta.module;

  let source: AdminActionLogDetailSource = body || title || excerpt ? "metadata" : "none";
  let sourceNote: string | null = null;

  if (input.targetType === "user") {
    const profileDetail = await resolveProfileDetail(input.targetId, metadata);
    title = title ?? profileDetail.title ?? null;
    excerpt = excerpt ?? profileDetail.excerpt ?? null;
    profileSnapshot = profileDetail.profileSnapshot ?? null;
    if (profileDetail.source && profileDetail.source !== "metadata") {
      source = profileDetail.source;
      sourceNote = profileDetail.sourceNote ?? sourceNote;
    } else if (profileSnapshot) {
      source = source === "none" ? "metadata" : source;
    }
  }

  if (isContentTargetType(input.targetType)) {
    if (!body) {
      const snapshot = await getContentSnapshot(
        input.targetType,
        input.targetId,
      );
      if (snapshot) {
        body = snapshot.body;
        title =
          title ??
          snapshot.title ??
          (input.targetType === TARGET_TYPES.comment
            ? `评论：${snapshot.excerpt ?? "（无摘要）"}`
            : input.targetType === TARGET_TYPES.course_review
              ? `课程评价：${snapshot.excerpt ?? "（无摘要）"}`
              : null);
        excerpt = excerpt ?? snapshot.excerpt;
        contentModule = contentModule ?? snapshot.module;
        status = snapshot.status;
        deletedAt = snapshot.deletedAt;
        authorName = await resolveAuthorName(snapshot.ownerId);
        source = source === "metadata" ? "mixed" : "database";
        sourceNote = "自数据库补查（历史记录未写入完整备份）";
      }
    }

    if (!body) {
      const archive = await getLatestArchiveForTarget(
        input.targetType,
        input.targetId,
      );
      if (archive) {
        const backup = readBackupBody(archive.snapshot);
        body = backup.body;
        title = title ?? archive.title ?? backup.title;
        excerpt =
          excerpt ??
          (body && body.length > 280 ? `${body.slice(0, 280)}…` : body);
        contentModule = contentModule ?? archive.module ?? backup.module;
        source = source === "metadata" || source === "mixed" ? "mixed" : "archive";
        sourceNote =
          source === "archive"
            ? "自封存库补查（历史记录未写入完整备份）"
            : sourceNote;
        if (!authorName) {
          const ownerId =
            typeof archive.snapshot.owner_id === "string"
              ? archive.snapshot.owner_id
              : null;
          authorName = await resolveAuthorName(ownerId);
        }
      }
    } else if (!authorName) {
      const snapshot = await getContentSnapshot(
        input.targetType,
        input.targetId,
      );
      authorName = await resolveAuthorName(snapshot?.ownerId ?? null);
    }
  }

  const hasContent =
    Boolean(body) ||
    Boolean(title) ||
    Boolean(excerpt) ||
    Boolean(reason) ||
    Boolean(appealNote) ||
    Boolean(profileSnapshot);

  if (!hasContent) {
    return {
      title: null,
      excerpt: null,
      reason,
      appealNote,
      body: null,
      module: null,
      status: null,
      deletedAt: null,
      authorName: null,
      profileSnapshot: null,
      source: "none",
      sourceNote: "当时未写入备份，且数据库与封存库中均未找到可恢复内容",
    };
  }

  return {
    title,
    excerpt,
    reason,
    appealNote,
    body,
    module: contentModule,
    status,
    deletedAt,
    authorName,
    profileSnapshot,
    source,
    sourceNote,
  };
}
