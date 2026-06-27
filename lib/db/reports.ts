import {
  REPORT_STATUS,
  type ReportReasonId,
  type ReportStatus,
  type TargetType,
} from "@/constants/reportReasons";
import {
  mapReport,
  mapReportWithReporter,
  type ReportWithProfileRow,
} from "@/lib/db/mappers/report";
import { DbError } from "@/lib/db/shared";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type AdminReportFilters } from "@/types/admin";
import { type Report, type ReportWithReporter } from "@/types/report";

type CreateAdminActionInput = {
  adminId: string;
  action: string;
  targetType: TargetType | "user";
  targetId: string;
  metadata?: Record<string, unknown> | null;
};

export async function createAdminAction(input: CreateAdminActionInput): Promise<void> {
  await logAdminAction(input);
}

export async function logAdminAction(input: CreateAdminActionInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("admin_action_logs").insert({
    admin_id: input.adminId,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId,
    metadata: input.metadata ?? null,
  });

  if (error) {
    console.error("Failed to log admin action:", error);
  }
}

export async function getReports(
  filters: AdminReportFilters = {},
): Promise<ReportWithReporter[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { status, targetType, page = 1, pageSize = 50 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = await createClient();

  let query = supabase
    .from("reports")
    .select("*, profiles!reports_reporter_id_fkey(*)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  if (targetType) {
    query = query.eq("target_type", targetType);
  }

  const { data, error } = await query;

  if (error) {
    const fallback = await supabase
      .from("reports")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fallback.error || !fallback.data) {
      console.error("Failed to list reports:", error);
      return [];
    }

    return (fallback.data as ReportWithProfileRow[]).map(mapReportWithReporter);
  }

  return ((data ?? []) as ReportWithProfileRow[]).map(mapReportWithReporter);
}

/** @deprecated 使用 getReports */
export const listReports = getReports;

export async function getReportById(reportId: string): Promise<Report | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapReport(data as ReportWithProfileRow);
}

export async function updateReportStatus(
  reportId: string,
  adminId: string,
  status: ReportStatus,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (fetchError || !report) {
    throw new DbError("举报记录不存在");
  }

  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === REPORT_STATUS.resolved || status === REPORT_STATUS.dismissed) {
    payload.resolved_by = adminId;
    payload.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from("reports").update(payload).eq("id", reportId);

  if (error) {
    throw new DbError(error.message);
  }

  const actionMap: Partial<Record<ReportStatus, string>> = {
    [REPORT_STATUS.resolved]: "update_report_status_resolved",
    [REPORT_STATUS.dismissed]: "update_report_status_dismissed",
    [REPORT_STATUS.reviewed]: "update_report_status_reviewed",
  };

  await logAdminAction({
    adminId,
    action: actionMap[status] ?? "update_report_status",
    targetType: report.target_type as TargetType,
    targetId: report.target_id,
    metadata: { reportId, status },
  });
}

export async function resolveReportsForTarget(
  targetType: TargetType,
  targetId: string,
  adminId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_reports_for_target", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_admin_id: adminId,
  });

  if (error) {
    console.error("Failed to resolve reports for target:", error.message ?? error);
  }
}

export async function resolveReport(
  reportId: string,
  adminId: string,
  status: "resolved" | "dismissed",
): Promise<void> {
  await updateReportStatus(reportId, adminId, status);
}

export async function createReport(input: {
  reporterId: string;
  targetType: TargetType;
  targetId: string;
  reason: ReportReasonId;
  description?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new DbError("数据库未配置");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    description: input.description ?? null,
    status: REPORT_STATUS.pending,
  });

  if (error) {
    throw new DbError(error.message);
  }
}
