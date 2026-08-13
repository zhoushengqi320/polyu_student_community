import {
  type ReportReasonId,
  type ReportStatus,
  type TargetType,
} from "@/constants/reportReasons";
import { type Report, type ReportWithReporter } from "@/types/report";
import { type Database } from "@/types/database";
import {
  mapProfileListItemOrFallback,
  type ProfileRow,
} from "@/lib/db/mappers/profile";

export type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: TargetType;
  target_id: string;
  reason: ReportReasonId;
  description: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportWithProfileRow = ReportRow & {
  profiles: ProfileRow | null;
};

export function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReportWithReporter(row: ReportWithProfileRow): ReportWithReporter {
  return {
    ...mapReport(row),
    reporter: mapProfileListItemOrFallback(
      row.profiles,
      row.reporter_id,
      "已删除用户",
    ),
  };
}

export type AdminActionLogRow =
  Database["public"]["Tables"] extends { admin_action_logs: { Row: infer R } }
    ? R
    : {
        id: string;
        admin_id: string;
        action: string;
        target_type: string;
        target_id: string;
        metadata: Record<string, unknown> | null;
        created_at: string;
      };
