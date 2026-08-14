"use client";

import { BookOpen } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { AdminContentPreviewDialog } from "@/components/admin/AdminContentPreviewDialog";
import {
  deleteGuideAction,
  hideGuideAction,
  publishGuideAction,
} from "@/lib/guides/actions";
import { CONTENT_STATUS, CONTENT_STATUS_LABELS } from "@/constants/contentStatus";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type AdminGuideDetail } from "@/types/guide";

type GuideManagementTableProps = {
  guides: AdminGuideDetail[];
  onCreate: () => void;
  onEdit: (guideId: string) => void;
};

function getGuideStatusLabel(guide: AdminGuideDetail) {
  if (guide.deletedAt) {
    return "已删除";
  }

  return CONTENT_STATUS_LABELS[guide.status as keyof typeof CONTENT_STATUS_LABELS] ?? guide.status;
}

function getGuideStatusClassName(guide: AdminGuideDetail) {
  if (guide.deletedAt) {
    return "bg-destructive/10 text-destructive";
  }

  if (guide.status === CONTENT_STATUS.hidden) {
    return "bg-amber-100 text-amber-900";
  }

  if (guide.status === CONTENT_STATUS.draft) {
    return "bg-muted text-muted-foreground";
  }

  return undefined;
}

export function GuideManagementTable({
  guides,
  onCreate,
  onEdit,
}: GuideManagementTableProps) {
  if (guides.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" onClick={onCreate}>
            创建攻略
          </Button>
        </div>
        <EmptyState
          icon={BookOpen}
          title="暂无攻略"
          description="可以先创建一篇草稿，确认内容后再发布到前台。"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={onCreate}>
          创建攻略
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[1080px] text-left text-xs">
          <thead className="border-b bg-muted/40">
            <tr className="whitespace-nowrap">
              <th className="px-3 py-2.5 font-medium">标题</th>
              <th className="px-3 py-2.5 font-medium">状态</th>
              <th className="px-3 py-2.5 font-medium">作者</th>
              <th className="px-3 py-2.5 font-medium">创建时间</th>
              <th className="px-3 py-2.5 font-medium">更新时间</th>
              <th className="px-3 py-2.5 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => {
              const isDeleted = Boolean(guide.deletedAt);
              const canView =
                !isDeleted && guide.status === CONTENT_STATUS.published;
              const authorName =
                guide.author.displayName ?? guide.author.username ?? "—";

              return (
                <tr
                  key={guide.id}
                  className="whitespace-nowrap border-b last:border-0"
                >
                  <td className="max-w-[240px] px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onEdit(guide.id)}
                      className="block w-full truncate text-left font-medium hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isDeleted}
                      title={guide.title}
                    >
                      {guide.title}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <TagBadge
                      label={getGuideStatusLabel(guide)}
                      className={`text-[11px] ${getGuideStatusClassName(guide) ?? ""}`}
                    />
                  </td>
                  <td className="max-w-[100px] truncate px-3 py-2 text-muted-foreground">
                    {authorName}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDateTime(guide.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatDateTime(guide.updatedAt)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-nowrap items-center justify-end gap-1.5">
                      {canView ? (
                        <AdminContentPreviewDialog
                          targetType={TARGET_TYPES.post}
                          targetId={guide.id}
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="h-7 px-2 text-xs"
                        >
                          查看
                        </Button>
                      )}

                      {!isDeleted ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => onEdit(guide.id)}
                        >
                          编辑
                        </Button>
                      ) : null}

                      {!isDeleted &&
                      (guide.status === CONTENT_STATUS.draft ||
                        guide.status === CONTENT_STATUS.hidden) ? (
                        <AdminConfirmButton
                          label={
                            guide.status === CONTENT_STATUS.hidden
                              ? "重新发布"
                              : "发布"
                          }
                          confirmTitle={
                            guide.status === CONTENT_STATUS.hidden
                              ? "确认重新发布攻略？"
                              : "确认发布攻略？"
                          }
                          confirmDescription="发布后，学生将在 /guides 看到这篇攻略。"
                          action={publishGuideAction}
                          hiddenFields={{ guideId: guide.id }}
                          variant="default"
                          className="h-7 px-2 text-xs"
                        />
                      ) : null}

                      {!isDeleted && guide.status === CONTENT_STATUS.published ? (
                        <AdminConfirmButton
                          label="隐藏"
                          confirmTitle="确认隐藏攻略？"
                          confirmDescription="隐藏后前台将不再显示，可在后台重新发布。"
                          action={hideGuideAction}
                          hiddenFields={{ guideId: guide.id }}
                          variant="outline"
                          className="h-7 px-2 text-xs"
                        />
                      ) : null}

                      {!isDeleted ? (
                        <AdminConfirmButton
                          label="删除"
                          confirmTitle="确认删除攻略？"
                          confirmDescription="此操作将软删除该攻略，前台将不再显示。"
                          action={deleteGuideAction}
                          hiddenFields={{ guideId: guide.id }}
                          className="h-7 px-2 text-xs"
                        />
                      ) : (
                        <span className="self-center text-[11px] text-muted-foreground">
                          已删除
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
