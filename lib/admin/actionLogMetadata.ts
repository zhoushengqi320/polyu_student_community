import { type ContentSnapshot } from "@/lib/db/moderation";

export type AdminActionLogMetadata = Record<string, unknown>;

export function buildContentActionMetadata(
  snapshot: ContentSnapshot | null,
  extras?: {
    reason?: string;
    deletedAt?: string;
    reportId?: string;
    archiveId?: string;
    appealNote?: string | null;
    [key: string]: unknown;
  },
): AdminActionLogMetadata {
  const reason = extras?.reason?.trim();
  const metadata: AdminActionLogMetadata = { ...extras };

  if (reason) {
    metadata.reason = reason;
  }

  if (snapshot) {
    metadata.title = snapshot.title ?? null;
    metadata.excerpt = snapshot.excerpt ?? null;
    metadata.module = snapshot.module ?? null;
    metadata.targetLabel =
      snapshot.title ?? snapshot.excerpt ?? null;
    metadata.contentBackup = {
      title: snapshot.title ?? null,
      content: snapshot.body ?? null,
      module: snapshot.module ?? null,
      status: snapshot.status ?? null,
      owner_id: snapshot.ownerId ?? null,
    };
  }

  return metadata;
}

export function buildProfileActionMetadata(input: {
  nickname: string | null;
  reason: string;
  avatarUrl?: string | null;
}): AdminActionLogMetadata {
  const reason = input.reason.trim();
  const nickname = input.nickname?.trim() || null;

  return {
    reason,
    title: nickname ? `昵称：${nickname}` : "用户资料",
    targetLabel: nickname ?? "用户资料",
    excerpt: input.avatarUrl ? "含头像变更" : null,
    profileSnapshot: {
      nickname,
      avatarUrl: input.avatarUrl ?? null,
    },
  };
}

export function buildArchiveActionMetadata(input: {
  title: string | null;
  snapshot: Record<string, unknown> | null;
  reason: string;
  archiveId: string;
  appealNote?: string | null;
}): AdminActionLogMetadata {
  const content =
    typeof input.snapshot?.content === "string"
      ? input.snapshot.content
      : null;

  return {
    reason: input.reason.trim(),
    title: input.title,
    targetLabel: input.title ?? "封存内容",
    excerpt:
      content && content.length > 280
        ? `${content.slice(0, 280)}…`
        : content,
    archiveId: input.archiveId,
    appealNote: input.appealNote ?? null,
    contentBackup: input.snapshot
      ? {
          title: input.title,
          content,
          module:
            typeof input.snapshot.module === "string"
              ? input.snapshot.module
              : null,
          owner_id:
            typeof input.snapshot.owner_id === "string"
              ? input.snapshot.owner_id
              : null,
        }
      : null,
  };
}
