"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Flag } from "lucide-react";
import {
  confirmReportViolationAction,
  dismissReportAction,
  adminDeleteFoodRecommendationAction,
  adminDeleteForumCommentAction,
  adminDeleteReportedPostAction,
  adminHideFoodPlaceAction,
  markReportReviewedAction,
} from "@/lib/admin/actions";
import {
  adminActionInitialState,
  type AdminActionState,
} from "@/lib/admin/state";
import {
  getReportReasonLabel,
  REPORT_STATUS,
  TARGET_TYPES,
} from "@/constants/reportReasons";
import {
  isReportOpenStatus,
  REPORT_STATUS_LABELS,
  TARGET_TYPE_LABELS,
} from "@/constants/admin";
import { ROUTES } from "@/constants/routes";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type ReportWithReporter } from "@/types/report";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";

type ReportTableProps = {
  reports: ReportWithReporter[];
};

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.error) {
    return <p className="text-xs text-destructive">{state.error}</p>;
  }

  if (state.success) {
    return <p className="text-xs text-green-600">{state.success}</p>;
  }

  return null;
}

function ReportActionForm({
  reportId,
  action,
  label,
  variant = "outline",
}: {
  reportId: string;
  action: typeof confirmReportViolationAction | typeof dismissReportAction | typeof markReportReviewedAction;
  label: string;
  variant?: "default" | "outline" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(
    action,
    adminActionInitialState,
  );

  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="reportId" value={reportId} />
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "处理中..." : label}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

function getContentLink(report: ReportWithReporter): string | null {
  if (report.targetType === TARGET_TYPES.post) {
    switch (report.postModule) {
      case "forum":
        return ROUTES.forum.detail(report.targetId);
      case "guides":
        return ROUTES.guides.detail(report.targetId);
      case "study":
        return ROUTES.study.detail(report.targetId);
      case "life":
        return ROUTES.life.detail(report.targetId);
      default:
        return null;
    }
  }

  if (report.targetType === TARGET_TYPES.food_place) {
    return ROUTES.food.detail(report.targetId);
  }

  if (
    report.targetType === TARGET_TYPES.food_recommendation &&
    report.foodPlaceId
  ) {
    return ROUTES.food.detail(report.foodPlaceId);
  }

  return null;
}

function getReportedPostDeleteLabel(postModule: string | null | undefined): string {
  switch (postModule) {
    case "guides":
      return "删除攻略";
    case "study":
    case "life":
      return "删除文章";
    case "forum":
    default:
      return "删除帖子";
  }
}

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
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 font-medium">举报类型</th>
            <th className="px-4 py-3 font-medium">原因</th>
            <th className="px-4 py-3 font-medium">说明</th>
            <th className="px-4 py-3 font-medium">举报人</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">时间</th>
            <th className="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const isPending = isReportOpenStatus(report.status);
            const contentLink = getContentLink(report);
            const canDeleteReportedPost = report.targetType === TARGET_TYPES.post;
            const canDeleteComment = report.targetType === TARGET_TYPES.comment;
            const canHideFoodPlace =
              report.targetType === TARGET_TYPES.food_place;
            const canDeleteFoodRecommendation =
              report.targetType === TARGET_TYPES.food_recommendation;

            return (
              <tr key={report.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TagBadge label={TARGET_TYPE_LABELS[report.targetType]} />
                    {report.postModule ? (
                      <span className="text-xs text-muted-foreground">
                        {report.postModule}
                      </span>
                    ) : null}
                    {contentLink ? (
                      <Link
                        href={contentLink}
                        className="text-primary hover:underline"
                      >
                        查看内容
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        ID: {report.targetId.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getReportReasonLabel(report.reason)}
                </td>
                <td className="px-4 py-3">
                  <p className="max-w-xs text-xs text-muted-foreground line-clamp-2">
                    {report.description || "—"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div>{report.reporter.displayName ?? report.reporter.username}</div>
                  <div className="text-xs text-muted-foreground">
                    @{report.reporter.username}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TagBadge
                    label={REPORT_STATUS_LABELS[report.status]}
                    className={statusBadgeClass(report.status)}
                  />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(report.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {isPending ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      {canDeleteReportedPost ? (
                        <AdminConfirmButton
                          label={getReportedPostDeleteLabel(report.postModule)}
                          confirmTitle="确认删除被举报的内容？"
                          confirmDescription="将按内容所属模块软删除，并自动将相关举报标记为已处理。"
                          action={adminDeleteReportedPostAction}
                          hiddenFields={{ postId: report.targetId }}
                          variant="destructive"
                        />
                      ) : null}
                      {canDeleteComment ? (
                        <AdminConfirmButton
                          label="删除评论"
                          confirmTitle="确认删除被举报的评论？"
                          confirmDescription="将软删除该评论，并自动将相关举报标记为已处理。"
                          action={adminDeleteForumCommentAction}
                          hiddenFields={{ commentId: report.targetId }}
                          variant="destructive"
                        />
                      ) : null}
                      {canHideFoodPlace ? (
                        <AdminConfirmButton
                          label="隐藏地点"
                          confirmTitle="确认隐藏被举报的地点？"
                          confirmDescription="地点将从前台列表隐藏，并自动将相关举报标记为已处理。"
                          action={adminHideFoodPlaceAction}
                          hiddenFields={{ placeId: report.targetId }}
                          variant="destructive"
                        />
                      ) : null}
                      {canDeleteFoodRecommendation ? (
                        <AdminConfirmButton
                          label="删除推荐"
                          confirmTitle="确认删除被举报的推荐？"
                          confirmDescription="将软删除该推荐，并自动将相关举报标记为已处理。"
                          action={adminDeleteFoodRecommendationAction}
                          hiddenFields={{ recommendationId: report.targetId }}
                          variant="destructive"
                        />
                      ) : null}
                      <ReportActionForm
                        reportId={report.id}
                        action={markReportReviewedAction}
                        label="标记已审核"
                      />
                      <ReportActionForm
                        reportId={report.id}
                        action={confirmReportViolationAction}
                        label="确认违规"
                        variant="destructive"
                      />
                      <ReportActionForm
                        reportId={report.id}
                        action={dismissReportAction}
                        label="驳回（无违规）"
                        variant="outline"
                      />
                    </div>
                  ) : (
                    <span className="block text-right text-xs text-muted-foreground">
                      已结案
                    </span>
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
