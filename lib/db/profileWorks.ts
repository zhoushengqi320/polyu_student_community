import {
  ARCHIVE_APPEAL_STATUS,
  type ArchiveAppealStatus,
} from "@/constants/moderation";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import {
  listActiveArchivesByOwner,
  type ContentArchiveRow,
} from "@/lib/db/contentArchives";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ProfileWorkItem = {
  id: string;
  targetType: TargetType;
  title: string;
  excerpt: string | null;
  status: string;
  module: string | null;
  createdAt: string;
  /** 隐藏或处于活跃封存 */
  isRestricted: boolean;
  archive: {
    id: string;
    appealDeadline: string;
    appealStatus: ArchiveAppealStatus;
    appealNote: string | null;
    canAppeal: boolean;
  } | null;
};

function excerptOf(text: string | null | undefined, max = 120): string | null {
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

function archiveMapByTarget(
  archives: ContentArchiveRow[],
): Map<string, ContentArchiveRow> {
  const map = new Map<string, ContentArchiveRow>();
  for (const archive of archives) {
    const key = `${archive.target_type}:${archive.target_id}`;
    if (!map.has(key)) {
      map.set(key, archive);
    }
  }
  return map;
}

function toArchiveInfo(archive: ContentArchiveRow | undefined) {
  if (!archive) {
    return null;
  }
  const withinDeadline =
    new Date(archive.appeal_deadline).getTime() >= Date.now();
  const canAppeal =
    withinDeadline &&
    (archive.appeal_status === ARCHIVE_APPEAL_STATUS.none ||
      archive.appeal_status === ARCHIVE_APPEAL_STATUS.rejected);

  return {
    id: archive.id,
    appealDeadline: archive.appeal_deadline,
    appealStatus: archive.appeal_status,
    appealNote: archive.appeal_note,
    canAppeal,
  };
}

async function getWorksClient() {
  try {
    return createAdminClient();
  } catch {
    return createClient();
  }
}

function targetTypeLabel(type: string): string {
  switch (type) {
    case TARGET_TYPES.comment:
      return "评论";
    case TARGET_TYPES.course_review:
      return "课程评价";
    case TARGET_TYPES.food_recommendation:
      return "美食推荐";
    case TARGET_TYPES.post:
    default:
      return "帖子";
  }
}

/** 作者本人可见：论坛帖 + 活跃封存（含评论/课评等），含 hidden。 */
export async function listProfileWorks(
  userId: string,
): Promise<ProfileWorkItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await getWorksClient();
  const [{ data: posts, error }, archives] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, content, excerpt, status, module, created_at, deleted_at")
      .eq("user_id", userId)
      .eq("module", "forum")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
    listActiveArchivesByOwner(userId),
  ]);

  if (error) {
    console.error("Failed to list profile works:", error);
  }

  const archivesByTarget = archiveMapByTarget(archives);
  const items: ProfileWorkItem[] = ((posts ?? []) as Array<{
    id: string;
    title: string;
    content: string;
    excerpt: string | null;
    status: string;
    module: string;
    created_at: string;
  }>).map((row) => {
    const archive = archivesByTarget.get(`${TARGET_TYPES.post}:${row.id}`);
    const isRestricted =
      row.status === CONTENT_STATUS.hidden ||
      row.status === CONTENT_STATUS.removed ||
      Boolean(archive);

    return {
      id: row.id,
      targetType: TARGET_TYPES.post,
      title: row.title,
      excerpt: row.excerpt ?? excerptOf(row.content),
      status: row.status,
      module: row.module,
      createdAt: row.created_at,
      isRestricted,
      archive: toArchiveInfo(archive),
    };
  });

  const seen = new Set(items.map((item) => `${item.targetType}:${item.id}`));

  // 活跃封存：含已软删原文，以及评论/课评/推荐等非帖类型（不含私信）
  for (const archive of archives) {
    if (
      archive.target_type === TARGET_TYPES.message ||
      archive.module === "message"
    ) {
      continue;
    }

    const key = `${archive.target_type}:${archive.target_id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const snapshotContent =
      (archive.snapshot?.content as string | null | undefined) ??
      (archive.snapshot?.body as string | null | undefined) ??
      null;
    const snapshotTitle =
      archive.title ??
      (archive.snapshot?.title as string | null | undefined) ??
      null;

    items.push({
      id: archive.target_id,
      targetType: archive.target_type as TargetType,
      title:
        snapshotTitle ??
        `已封存的${targetTypeLabel(archive.target_type)}`,
      excerpt: excerptOf(snapshotContent),
      status: CONTENT_STATUS.hidden,
      module:
        archive.module ??
        (archive.snapshot?.module as string | null | undefined) ??
        null,
      createdAt: archive.archived_at,
      isRestricted: true,
      archive: toArchiveInfo(archive),
    });
  }

  return items.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}
