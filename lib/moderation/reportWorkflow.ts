import {
  FALSE_REPORT_BAN_DAYS,
  NOTIFICATION_TYPES,
  REPORT_AUTO_HIDE_THRESHOLD,
} from "@/constants/moderation";
import {
  REPORT_STATUS,
  type ReportReasonId,
  type TargetType,
} from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import {
  countDistinctReporters,
  getContentOwnerId,
  hideContentByTarget,
  listOpenReporterIdsForTarget,
  restoreContentByTarget,
} from "@/lib/db/moderation";
import { createNotifications } from "@/lib/db/notifications";
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

export async function processNewReport(input: {
  reporterId: string;
  targetType: TargetType;
  targetId: string;
  reason: ReportReasonId;
  description?: string | null;
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

  let autoHidden = false;

  if (reporterCount >= REPORT_AUTO_HIDE_THRESHOLD) {
    autoHidden = await hideContentByTarget(input.targetType, input.targetId);

    if (autoHidden) {
      const ownerId = await getContentOwnerId(input.targetType, input.targetId);
      if (ownerId) {
        await createNotifications([
          {
            userId: ownerId,
            type: NOTIFICATION_TYPES.contentAutoHidden,
            title: "您的内容已被暂时隐藏",
            body: `因收到 ${reporterCount} 次举报，相关内容已暂时从前台隐藏，等待管理员审核。`,
            link: ROUTES.admin,
            metadata: {
              targetType: input.targetType,
              targetId: input.targetId,
            },
          },
        ]);
      }

      await logAdminAction({
        adminId: null,
        action: "auto_hide_content_reports",
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: { reporterCount },
      });
    }
  }

  return { reporterCount, autoHidden };
}

export async function confirmReportViolation(
  reportId: string,
  adminId: string,
): Promise<void> {
  const report = await getReportById(reportId);

  if (!OPEN_REPORT_STATUSES.includes(report.status as (typeof OPEN_REPORT_STATUSES)[number])) {
    throw new DbError("该举报已结案");
  }

  await hideContentByTarget(report.target_type, report.target_id);

  const ownerId = await getContentOwnerId(report.target_type, report.target_id);
  const reporterIds = await listOpenReporterIdsForTarget(
    report.target_type,
    report.target_id,
  );

  await resolveReportsForTarget(report.target_type, report.target_id, adminId);

  const notifications = [];

  if (ownerId) {
    notifications.push({
      userId: ownerId,
      type: NOTIFICATION_TYPES.contentRemoved,
      title: "您的内容因违规已被下架",
      body: "经管理员审核确认违规，相关内容已下架。如有异议，可查阅社区规则并联系管理员。",
      link: ROUTES.about.communityRules,
      metadata: {
        targetType: report.target_type,
        targetId: report.target_id,
        reportId,
      },
    });
  }

  for (const reporterId of reporterIds) {
    notifications.push({
      userId: reporterId,
      type: NOTIFICATION_TYPES.reportResolved,
      title: "您的举报已处理",
      body: "管理员已确认该内容违规并完成处理，感谢您对社区安全的贡献。",
      link: ROUTES.about.communityRules,
      metadata: { reportId, targetId: report.target_id },
    });
  }

  await createNotifications(notifications);

  await logAdminAction({
    adminId,
    action: "confirm_report_violation",
    targetType: report.target_type,
    targetId: report.target_id,
    metadata: { reportId },
  });
}

export async function dismissReportWithReview(
  reportId: string,
  adminId: string,
): Promise<void> {
  const report = await getReportById(reportId);

  if (!OPEN_REPORT_STATUSES.includes(report.status as (typeof OPEN_REPORT_STATUSES)[number])) {
    throw new DbError("该举报已结案");
  }

  const restored = await restoreContentByTarget(
    report.target_type,
    report.target_id,
  );

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error: dismissError } = await supabase
    .from("reports")
    .update({
      status: REPORT_STATUS.dismissed,
      resolved_by: adminId,
      resolved_at: now,
      updated_at: now,
    })
    .eq("id", reportId);

  if (dismissError) {
    throw new DbError(dismissError.message);
  }

  const ownerId = await getContentOwnerId(report.target_type, report.target_id);
  const notifications = [];

  if (restored && ownerId) {
    notifications.push({
      userId: ownerId,
      type: NOTIFICATION_TYPES.contentRestored,
      title: "您的内容已恢复公开",
      body: "经管理员审核，相关内容不构成违规，已恢复展示。",
      link: ROUTES.about.communityRules,
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
  const nextWarnings = currentWarnings + 1;
  const isAdminReporter =
    (reporterProfile as { role?: string } | null)?.role === "admin";

  if (!isAdminReporter) {
    const profileUpdate: Record<string, unknown> = {
      reporter_warning_count: nextWarnings,
    };

    if (nextWarnings >= 2) {
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + FALSE_REPORT_BAN_DAYS);
      profileUpdate.banned_until = bannedUntil.toISOString();

      notifications.push({
        userId: report.reporter_id,
        type: NOTIFICATION_TYPES.reporterBanned,
        title: "账号因恶意举报被临时限制",
        body: `您第 ${nextWarnings} 次被判定为恶意举报，账号将被限制互动 ${FALSE_REPORT_BAN_DAYS} 天。`,
        link: ROUTES.about.communityRules,
        metadata: { reportId, warningCount: nextWarnings },
      });
    } else {
      notifications.push({
        userId: report.reporter_id,
        type: NOTIFICATION_TYPES.reporterWarning,
        title: "恶意举报警告",
        body: "经审核，该举报不成立。再次恶意举报可能导致账号被临时限制。",
        link: ROUTES.about.communityRules,
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
    body: "管理员审核后认为该内容不构成违规，举报已驳回。",
    link: ROUTES.about.communityRules,
    metadata: { reportId },
  });

  await createNotifications(notifications);

  await logAdminAction({
    adminId,
    action: "dismiss_report",
    targetType: report.target_type,
    targetId: report.target_id,
    metadata: {
      reportId,
      restored,
      reporterWarningCount: nextWarnings,
    },
  });
}
