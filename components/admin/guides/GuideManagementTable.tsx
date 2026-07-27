"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  deleteGuideAction,
  hideGuideAction,
  publishGuideAction,
} from "@/lib/guides/actions";
import { CONTENT_STATUS, CONTENT_STATUS_LABELS } from "@/constants/contentStatus";
import { ROUTES } from "@/constants/routes";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils/formatDate";
import { getGuideCategoryLabel } from "@/constants/guides";
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
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">作者</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="px-4 py-3 font-medium">更新时间</th>
              <th className="px-4 py-3 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => {
              const isDeleted = Boolean(guide.deletedAt);
              const canView =
                !isDeleted && guide.status === CONTENT_STATUS.published;

              return (
                <tr key={guide.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onEdit(guide.id)}
                      className="line-clamp-2 text-left font-medium hover:text-primary"
                      disabled={isDeleted}
                    >
                      {guide.title}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {getGuideCategoryLabel(guide.meta?.category ?? guide.categoryId)}
                  </td>
                  <td className="px-4 py-3">
                    <TagBadge
                      label={getGuideStatusLabel(guide)}
                      className={getGuideStatusClassName(guide)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {guide.author.displayName ?? guide.author.username}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(guide.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(guide.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {canView ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={ROUTES.guides.detail(guide.id)} target="_blank">
                            查看
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          查看
                        </Button>
                      )}

                      {!isDeleted ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
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
                        />
                      ) : null}

                      {!isDeleted ? (
                        <AdminConfirmButton
                          label="删除"
                          confirmTitle="确认删除攻略？"
                          confirmDescription="此操作将软删除该攻略，前台将不再显示。"
                          action={deleteGuideAction}
                          hiddenFields={{ guideId: guide.id }}
                        />
                      ) : (
                        <span className="self-center text-xs text-muted-foreground">
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
