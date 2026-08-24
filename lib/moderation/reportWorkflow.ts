import {
  ARCHIVE_APPEAL_DAYS,
  ARCHIVE_APPEAL_STATUS,
  FALSE_REPORT_BAN_DAYS,
  NOTIFICATION_TYPES,
  REPORT_AUTO_HIDE_THRESHOLD,
} from "@/constants/moderation";
import {
  REPORT_STATUS,
  TARGET_TYPES,
  type ReportReasonId,
  type TargetType,
} from "@/constants/reportReasons";
import { TARGET_TYPE_LABELS } from "@/constants/admin";
import { ROUTES } from "@/constants/routes";
import {
  deleteArchiveEntry,
  ensureContentArchived,
  getActiveArchiveForTarget,
  markArchiveRestored,
  rejectArchiveAppeal,
  submitArchiveAppeal,
  type ContentArchiveSnapshot,
} from "@/lib/db/contentArchives";
import {
  countDistinctReporters,
  getContentOwnerId,
  getContentSnapshot,
  hideContentByTarget,
  listOpenReporterIdsForTarget,
  restoreContentByTarget,
  restoreSoftDeletedContentByTarget,
} from "@/lib/db/moderation";
import { createNotifications } from "@/lib/db/notifications";
import {
  buildArchiveActionMetadata,
  buildContentActionMetadata,
} from "@/lib/admin/actionLogMetadata";
import { logAdminAction, resolveReportsForTarget } from "@/lib/db/reports";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type CreateReportResult = {
  reporterCount: number;
  autoHidden: boolean;
};

const OPEN_REPORT_STATUSES = [
  REPORT_STATUS.pending,
  REPORT_STATUS.reviewing,
  REPORT_STATUS.reviewed,
];

async function getReportById(reportId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !data) {
    throw new DbError("举报记录不存在");
  }

  return data as {
    id: string;
    reporter_id: string;
    target_type: TargetType;
    target_id: string;
    status: string;
  };
}

function formatTargetLabel(
  targetType: TargetType,
  title: string | null | undefined,
): string {
  const typeLabel = TARGET_TYPE_LABELS[targetType] ?? "内容";
  const trimmed = title?.trim();
  if (trimmed) {
    return `${typeLabel}「${trimmed}」`;
  }
  return typeLabel;
}

function profileWorksLink(ownerId: string): string {
  return `${ROUTES.profile(ownerId)}#works`;
}

function buildArchiveSnapshot(
  snapshot: Awaited<ReturnType<typeof getContentSnapshot>>,
): ContentArchiveSnapshot {
  return {
    ...(snapshot?.raw ?? {}),
    owner_id: snapshot?.ownerId ?? null,
    title: snapshot?.title ?? null,
    content: snapshot?.body ?? null,
    module: snapshot?.module ?? null,
    status: snapshot?.status ?? null,
  };
}

function makeAppealDeadlineIso(): string {
  const appealDeadline = new Date();
  appealDeadline.setDate(appealDeadline.getDate() + ARCHIVE_APPEAL_DAYS);
  return appealDeadline.toISOString();
}

/**
 * 新举报：
 * 1) 首次：仅通知举报人，不下架、不通知作者
 * 2) 第二名不同举报人：隐藏 + 复制封存，通知作者可申诉
 */
export async function processNewReport(input: {
  reporterId: string;
  targetType: TargetType;
  targetId: string;
  reason: ReportReasonId;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<CreateReportResult> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", input.reporterId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .in("status", OPEN_REPORT_STATUSES)
    .maybeSingle();

  if (existing) {
    throw new DbError("您已举报过该内容，请等待管理员处理", "VALIDATION");
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    description: input.description ?? null,
    metadata: input.metadata ?? null,
    status: REPORT_STATUS.pending,
  });

  if (error) {
    if (error.code === "23505") {
      throw new DbError("您已举报过该内容，请等待管理员处理", "VALIDATION");
    }
    throw new DbError(error.message);
  }

  const reporterCount = await countDistinctReporters(
    input.targetType,
    input.targetId,
  );

  await createNotifications([
    {
      userId: input.reporterId,
      type: NOTIFICATION_TYPES.reportSubmitted,
      title: "举报成功，等待处理",
      body: "我们已收到您的举报，管理员将尽快审核。首次举报不会立即下架内容。",
      link: ROUTES.notifications,
      metadata: {
        targetType: input.targetType,
        targetId: input.targetId,
        reporterCount,
      },
    },
  ]);

  let autoHidden = false;

  if (reporterCount >= REPORT_AUTO_HIDE_THRESHOLD) {
    autoHidden = await hideContentByTarget(input.targetType, input.targetId);

    const snapshot = await getContentSnapshot(
      input.targetType,
      input.targetId,
    );
    const ownerId =
      snapshot?.ownerId ??
      (await getContentOwnerId(input.targetType, input.targetId));
    const targetLabel = formatTargetLabel(
      input.targetType,
      snapshot?.title ?? snapshot?.excerpt,
    );

    const { created } = await ensureContentArchived({
      targetType: input.targetType,
      targetId: input.targetId,
      module: snapshot?.module ?? null,
      title: snapshot?.title ?? snapshot?.excerpt ?? null,
      snapshot: buildArchiveSnapshot(snapshot),
      archivedBy: null,
      appealDeadline: makeAppealDeadlineIso(),
    });

    if (ownerId) {
      await createNotifications([
        {
          userId: ownerId,
          type: NOTIFICATION_TYPES.contentAutoHidden,
          title: "您的内容已被暂时隐藏",
          body: `因收到第 ${reporterCount} 名用户举报，${targetLabel}已暂时从前台隐藏并进入封存库。您可在 ${ARCHIVE_APPEAL_DAYS} 天内于「我的作品」提交申诉。`,
          link: profileWorksLink(ownerId),
          metadata: {
            targetType: input.targetType,
            targetId: input.targetId,
            appealDays: ARCHIVE_APPEAL_DAYS,
            archived: true,
            canAppeal: true,
          },
        },
      ]);
    }

    await logAdminAction({
      adminId: null,
      action: "auto_hide_content_reports",
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: { reporterCount, archived: created },
    });
  }

  return { reporterCount, autoHidden };
}

/**
 * 管理员确认违规：隐藏内容；若尚未封存则复制进封存库（30 天申诉期）；通知作者。
 */
export async function confirmReportViolation(
  reportId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const report = await getReportById(reportId);

  if (
    !OPEN_REPORT_STATUSES.includes(
      report.status as (typeof OPEN_REPORT_STATUSES)[number],
    )
  ) {
    throw new DbError("该举报已结案");
  }

  const snapshot = await getContentSnapshot(
    report.target_type,
    report.target_id,
  );
  const targetLabel = formatTargetLabel(
    report.target_type,
    snapshot?.title ?? snapshot?.excerpt,
  );

  await hideContentByTarget(report.target_type, report.target_id);

  const { created } = await ensureContentArchived({
    targetType: report.target_type,
    targetId: report.target_id,
    module: snapshot?.module ?? null,
    title: snapshot?.title ?? snapshot?.excerpt ?? null,
    snapshot: buildArchiveSnapshot(snapshot),
    archivedBy: adminId,
    appealDeadline: makeAppealDeadlineIso(),
  });

  const ownerId =
    snapshot?.ownerId ??
    (await getContentOwnerId(report.target_type, report.target_id));
  const reporterIds = await listOpenReporterIdsForTarget(
    report.target_type,
    report.target_id,
  );

  await resolveReportsForTarget(report.target_type, report.target_id, adminId);

  const notifications = [];

  if (ownerId) {
    if (report.target_type === TARGET_TYPES.message) {
      const conversationId =
        typeof snapshot?.raw?.conversation_id === "string"
          ? snapshot.raw.conversation_id
          : null;
      notifications.push({
        userId: ownerId,
        type: NOTIFICATION_TYPES.contentRemoved,
        title: "您的私信因违规已被处理",
        body: "经管理员审核，您发送的私信已被隐藏。如对处理有异议，可在会话中该消息旁点击问号提交申诉。",
        link: conversationId
          ? ROUTES.messages.conversation(conversationId)
          : ROUTES.messages.list,
        metadata: {
          targetType: report.target_type,
          targetId: report.target_id,
          reportId,
          canAppeal: true,
          appealInConversation: true,
        },
      });
    } else {
      notifications.push({
        userId: ownerId,
        type: NOTIFICATION_TYPES.contentRemoved,
        title: "您的内容因违规已下架",
        body: `经管理员审核，${targetLabel}已下架并进入封存库。您可在 ${ARCHIVE_APPEAL_DAYS} 天内于「我的作品」提交申诉说明。`,
        link: profileWorksLink(ownerId),
        metadata: {
          targetType: report.target_type,
          targetId: report.target_id,
          reportId,
          archived: true,
          appealDays: ARCHIVE_APPEAL_DAYS,
          canAppeal: true,
        },
      });
    }
  }

  for (const reporterId of reporterIds) {
    notifications.push({
      userId: reporterId,
      type: NOTIFICATION_TYPES.reportResolved,
      title: "您的举报已处理",
      body: `管理员已确认${targetLabel}违规并完成处理，感谢您对社区安全的贡献。`,
      link: ROUTES.notifications,
      metadata: { reportId, targetId: report.target_id },
    });
  }

  await createNotifications(notifications);

  await logAdminAction({
    adminId,
    action: "confirm_report_violation",
    targetType: report.target_type,
    targetId: report.target_id,
    metadata: {
      ...buildContentActionMetadata(snapshot, {
        reason,
        reportId,
      }),
      archived: true,
      archiveCreated: created,
    },
  });
}

/**
 * 驳回举报：恢复内容（若曾自动隐藏）；警告举报人并标记失信；
 * 若此前已有警告（warning_count >= 1），则封禁 30 天。
 */
export async function dismissReportWithReview(
  reportId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  const report = await getReportById(reportId);

  if (
    !OPEN_REPORT_STATUSES.includes(
      report.status as (typeof OPEN_REPORT_STATUSES)[number],
    )
  ) {
    throw new DbError("该举报已结案");
  }

  const snapshot = await getContentSnapshot(
    report.target_type,
    report.target_id,
  );
  const targetLabel = formatTargetLabel(
    report.target_type,
    snapshot?.title ?? snapshot?.excerpt,
  );

  const restored = await restoreContentByTarget(
    report.target_type,
    report.target_id,
  );

  const existingArchive = await getActiveArchiveForTarget(
    report.target_type,
    report.target_id,
  );
  if (existingArchive) {
    await markArchiveRestored({
      archiveId: existingArchive.id,
      restoredBy: adminId,
      appealNote: "管理员驳回举报后解除封存",
      appealStatus: ARCHIVE_APPEAL_STATUS.approved,
    });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // 驳回时结案该目标下全部 open 举报，避免恢复后仍有 pending
  const { error: dismissError } = await supabase
    .from("reports")
    .update({
      status: REPORT_STATUS.dismissed,
      resolved_by: adminId,
      resolved_at: now,
      updated_at: now,
    })
    .eq("target_type", report.target_type)
    .eq("target_id", report.target_id)
    .in("status", [...OPEN_REPORT_STATUSES]);

  if (dismissError) {
    throw new DbError(dismissError.message);
  }

  const ownerId =
    snapshot?.ownerId ??
    (await getContentOwnerId(report.target_type, report.target_id));
  const notifications = [];

  if (restored && ownerId) {
    notifications.push({
      userId: ownerId,
      type: NOTIFICATION_TYPES.contentRestored,
      title: "您的内容已恢复公开",
      body: `经管理员审核，${targetLabel}不构成违规，已恢复展示。`,
      link: ROUTES.notifications,
      metadata: {
        targetType: report.target_type,
        targetId: report.target_id,
      },
    });
  }

  const { data: reporterProfile, error: profileError } = await supabase
    .from("profiles")
    .select("reporter_warning_count, role")
    .eq("id", report.reporter_id)
    .maybeSingle();

  if (profileError) {
    throw new DbError(profileError.message);
  }

  const currentWarnings =
    (reporterProfile as { reporter_warning_count?: number } | null)
      ?.reporter_warning_count ?? 0;
  const hadPriorWarning = currentWarnings >= 1;
  const nextWarnings = currentWarnings + 1;
  const isAdminReporter =
    (reporterProfile as { role?: string } | null)?.role === "admin";

  if (!isAdminReporter) {
    const profileUpdate: Record<string, unknown> = {
      reporter_warning_count: nextWarnings,
      reporter_untrustworthy: true,
    };

    if (hadPriorWarning) {
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + FALSE_REPORT_BAN_DAYS);
      profileUpdate.banned_until = bannedUntil.toISOString();

      notifications.push({
        userId: report.reporter_id,
        type: NOTIFICATION_TYPES.reporterBanned,
        title: "账号因恶意举报被临时限制",
        body: `您此前已有恶意举报警告，本次再次被驳回，账号将被限制互动 ${FALSE_REPORT_BAN_DAYS} 天。`,
        link: ROUTES.notifications,
        metadata: { reportId, warningCount: nextWarnings },
      });
    } else {
      notifications.push({
        userId: report.reporter_id,
        type: NOTIFICATION_TYPES.reporterWarning,
        title: "恶意举报警告",
        body: `经审核，针对${targetLabel}的举报不成立。账号已标记为失信举报者；再次恶意举报将被临时限制 ${FALSE_REPORT_BAN_DAYS} 天。`,
        link: ROUTES.notifications,
        metadata: { reportId, warningCount: nextWarnings },
      });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", report.reporter_id);

    if (updateError) {
      throw new DbError(updateError.message);
    }
  }

  notifications.push({
    userId: report.reporter_id,
    type: NOTIFICATION_TYPES.reportDismissed,
    title: "您的举报已被驳回",
    body: `管理员审核后认为${targetLabel}不构成违规，举报已驳回。`,
    link: ROUTES.notifications,
    metadata: { reportId, untrustworthy: true },
  });

  await createNotifications(notifications);

  await logAdminAction({
    adminId,
    action: "dismiss_report",
    targetType: report.target_type,
    targetId: report.target_id,
    metadata: {
      ...buildContentActionMetadata(snapshot, {
        reason,
        reportId,
      }),
      restored,
      reporterWarningCount: nextWarnings,
      banned: hadPriorWarning && !isAdminReporter,
    },
  });
}

/** 作者在申诉期内提交申诉理由，进入待管理员审核（不自动恢复）。 */
export async function requestArchiveAppeal(input: {
  targetType: TargetType;
  targetId: string;
  userId: string;
  appealNote?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const note = input.appealNote?.trim() ?? "";
  if (!note) {
    throw new DbError("请填写申诉理由", "VALIDATION");
  }

  const archive = await getActiveArchiveForTarget(
    input.targetType,
    input.targetId,
  );

  if (!archive) {
    throw new DbError("未找到可申诉的封存记录", "VALIDATION");
  }

  if (new Date(archive.appeal_deadline).getTime() < Date.now()) {
    throw new DbError("申诉期限已过", "VALIDATION");
  }

  if (archive.appeal_status === ARCHIVE_APPEAL_STATUS.pending) {
    throw new DbError("申诉已提交，请等待管理员审核", "VALIDATION");
  }

  const ownerId =
    (archive.snapshot?.owner_id as string | null | undefined) ??
    (await getContentOwnerId(input.targetType, input.targetId));

  if (!ownerId || ownerId !== input.userId) {
    throw new DbError("仅内容作者可申诉", "VALIDATION");
  }

  await submitArchiveAppeal({
    archiveId: archive.id,
    appealNote: note,
  });

  await logAdminAction({
    adminId: null,
    action: "archive_appeal_submitted",
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: {
      archiveId: archive.id,
      appealedBy: input.userId,
      appealNote: note,
    },
  });
}

/** 管理员通过申诉：恢复公开并删除封存记录。 */
export async function approveArchiveAppeal(
  archiveId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_archives")
    .select("*")
    .eq("id", archiveId)
    .eq("appeal_status", ARCHIVE_APPEAL_STATUS.pending)
    .is("restored_at", null)
    .is("expired_at", null)
    .maybeSingle();

  if (error || !data) {
    throw new DbError("申诉不存在或已处理", "VALIDATION");
  }

  const archive = data as {
    id: string;
    target_type: TargetType;
    target_id: string;
    title: string | null;
    snapshot: ContentArchiveSnapshot;
    appeal_note: string | null;
  };

  await restoreSoftDeletedContentByTarget(
    archive.target_type,
    archive.target_id,
  );
  await restoreContentByTarget(archive.target_type, archive.target_id);
  await deleteArchiveEntry(archive.id);

  const ownerId =
    (archive.snapshot?.owner_id as string | null | undefined) ??
    (await getContentOwnerId(archive.target_type, archive.target_id));
  const targetLabel = formatTargetLabel(
    archive.target_type,
    archive.title ??
      (archive.snapshot?.title as string | null | undefined) ??
      null,
  );

  if (ownerId) {
    await createNotifications([
      {
        userId: ownerId,
        type: NOTIFICATION_TYPES.archiveAppealApproved,
        title: "申诉已通过，内容已恢复",
        body: `管理员已通过您对${targetLabel}的申诉，内容已重新公开。`,
        link: profileWorksLink(ownerId),
        metadata: {
          archiveId: archive.id,
          targetType: archive.target_type,
          targetId: archive.target_id,
        },
      },
    ]);
  }

  await logAdminAction({
    adminId,
    action: "archive_appeal_approved",
    targetType: archive.target_type,
    targetId: archive.target_id,
    metadata: buildArchiveActionMetadata({
      archiveId: archive.id,
      title: archive.title,
      snapshot: archive.snapshot,
      appealNote: archive.appeal_note,
      reason,
    }),
  });
}

/** 管理员驳回申诉：通知作者，内容保持封存。 */
export async function rejectArchiveAppealReview(
  archiveId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const archive = await rejectArchiveAppeal({ archiveId, adminId });
  const ownerId =
    (archive.snapshot?.owner_id as string | null | undefined) ??
    (await getContentOwnerId(
      archive.target_type as TargetType,
      archive.target_id,
    ));
  const targetLabel = formatTargetLabel(
    archive.target_type as TargetType,
    archive.title ??
      (archive.snapshot?.title as string | null | undefined) ??
      null,
  );

  if (ownerId) {
    await createNotifications([
      {
        userId: ownerId,
        type: NOTIFICATION_TYPES.archiveAppealRejected,
        title: "申诉未通过",
        body: `管理员未通过您对${targetLabel}的申诉，内容仍保持下架。如有疑问可通过站内反馈联系。`,
        link: profileWorksLink(ownerId),
        metadata: {
          archiveId: archive.id,
          targetType: archive.target_type,
          targetId: archive.target_id,
        },
      },
    ]);
  }

  await logAdminAction({
    adminId,
    action: "archive_appeal_rejected",
    targetType: archive.target_type as TargetType,
    targetId: archive.target_id,
    metadata: buildArchiveActionMetadata({
      archiveId: archive.id,
      title: archive.title,
      snapshot: archive.snapshot,
      appealNote: archive.appeal_note,
      reason,
    }),
  });
}
