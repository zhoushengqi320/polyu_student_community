"use client";

import { Flag } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  confirmReportViolationAction,
  dismissReportAction,
} from "@/lib/admin/actions";
import {
  getReportReasonLabel,
  REPORT_STATUS,
} from "@/constants/reportReasons";
import {
  isReportOpenStatus,
  REPORT_STATUS_LABELS,
  TARGET_TYPE_LABELS,
} from "@/constants/admin";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type ReportWithReporter } from "@/types/report";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { AdminContentPreviewDialog } from "@/components/admin/AdminContentPreviewDialog";
import { ADMIN_TABLE, adminTruncateCell } from "@/components/admin/adminTableClasses";

type ReportTableProps = {
  reports: ReportWithReporter[];
};

function statusBadgeClass(status: string): string | undefined {
  if (status === REPORT_STATUS.pending) {
    return "bg-amber-100 text-amber-800";
  }

  if (status === REPORT_STATUS.reviewed || status === REPORT_STATUS.reviewing) {
    return "bg-blue-100 text-blue-800";
  }

  if (status === REPORT_STATUS.resolved) {
    return "bg-green-100 text-green-800";
  }

  if (status === REPORT_STATUS.dismissed) {
    return "bg-muted text-muted-foreground";
  }

  return undefined;
}

export function ReportTable({ reports }: ReportTableProps) {
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={Flag}
        title="暂无举报记录"
        description="用户提交举报后将在此展示，便于审核处理。"
      />
    );
  }

  return (
    <div className={ADMIN_TABLE.wrap}>
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className={ADMIN_TABLE.headCell}>举报类型</th>
            <th className={ADMIN_TABLE.headCell}>原因</th>
            <th className={ADMIN_TABLE.headCell}>说明</th>
            <th className={ADMIN_TABLE.headCell}>举报人</th>
            <th className={ADMIN_TABLE.headCell}>状态</th>
            <th className={ADMIN_TABLE.headCell}>时间</th>
            <th className={`${ADMIN_TABLE.headCell} text-right`}>操作</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const isPending = isReportOpenStatus(report.status);

            return (
              <tr key={report.id} className={ADMIN_TABLE.row}>
                <td className={ADMIN_TABLE.cell}>
                  <div className="flex flex-nowrap items-center gap-2">
                    <TagBadge label={TARGET_TYPE_LABELS[report.targetType]} />
                    {report.postModule ? (
                      <span className="text-xs text-muted-foreground">
                        {report.postModule}
                      </span>
                    ) : null}
                    <AdminContentPreviewDialog
                      targetType={report.targetType}
                      targetId={report.targetId}
                    />
                  </div>
                </td>
                <td className={ADMIN_TABLE.cell}>
                  {getReportReasonLabel(report.reason)}
                </td>
                <td className={adminTruncateCell("max-w-[220px]")}>
                  <span
                    className="text-xs text-muted-foreground"
                    title={report.description || undefined}
                  >
                    {report.description || "—"}
                  </span>
                </td>
                <td className={adminTruncateCell("max-w-[160px]")}>
                  <span title={`@${report.reporter.username}`}>
                    {report.reporter.displayName ?? report.reporter.username}
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      @{report.reporter.username}
                    </span>
                  </span>
                </td>
                <td className={ADMIN_TABLE.cell}>
                  <TagBadge
                    label={REPORT_STATUS_LABELS[report.status]}
                    className={statusBadgeClass(report.status)}
                  />
                </td>
                <td className={`${ADMIN_TABLE.cell} text-muted-foreground`}>
                  {formatDateTime(report.createdAt)}
                </td>
                <td className={ADMIN_TABLE.cellRight}>
                  {isPending ? (
                    <div className={ADMIN_TABLE.actions}>
                      <AdminConfirmButton
                        label="确认违规"
                        confirmTitle="确认内容违规？"
                        confirmDescription="将下架内容并封存备份，通知作者与举报人。请填写审核理由。"
                        action={confirmReportViolationAction}
                        hiddenFields={{ reportId: report.id }}
                        requireReason
                        reasonLabel="审核理由"
                        reasonPlaceholder="说明违规依据（必填，将写入操作记录）"
                      />
                      <AdminConfirmButton
                        label="驳回（无违规）"
                        confirmTitle="驳回举报？"
                        confirmDescription="认为内容不构成违规，将恢复内容（如曾被自动隐藏）并通知举报人。请填写审核理由。"
                        action={dismissReportAction}
                        hiddenFields={{ reportId: report.id }}
                        variant="outline"
                        requireReason
                        reasonLabel="审核理由"
                        reasonPlaceholder="说明驳回依据（必填，将写入操作记录）"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">已结案</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
