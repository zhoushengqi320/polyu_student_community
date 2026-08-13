"use client";

import { BookOpen } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { AdminContentPreviewDialog } from "@/components/admin/AdminContentPreviewDialog";
import {
  deleteContentArticleAction,
  hideContentArticleAction,
  publishContentArticleAction,
} from "@/lib/content/cmsActions";
import { CONTENT_STATUS, CONTENT_STATUS_LABELS } from "@/constants/contentStatus";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils/formatDate";
import {
  type AdminContentArticle,
  type ContentCmsModule,
} from "@/lib/db/contentCms";

type ContentArticleTableProps = {
  module: ContentCmsModule;
  articles: AdminContentArticle[];
  onCreate: () => void;
  onEdit: (articleId: string) => void;
};

function statusLabel(article: AdminContentArticle) {
  if (article.deletedAt) return "已删除";
  return (
    CONTENT_STATUS_LABELS[article.status as keyof typeof CONTENT_STATUS_LABELS] ??
    article.status
  );
}

function statusClassName(article: AdminContentArticle) {
  if (article.deletedAt) return "bg-destructive/10 text-destructive";
  if (article.status === CONTENT_STATUS.hidden) return "bg-amber-100 text-amber-900";
  if (article.status === CONTENT_STATUS.draft) {
    return "bg-muted text-muted-foreground";
  }
  return undefined;
}

export function ContentArticleTable({
  module,
  articles,
  onCreate,
  onEdit,
}: ContentArticleTableProps) {
  const moduleLabel = module === "study" ? "学习指南" : "生活指南";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={onCreate}>
          创建{moduleLabel}
        </Button>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={`暂无${moduleLabel}`}
          description="可以先创建草稿，确认后再发布到前台。"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="border-b bg-muted/40">
              <tr className="whitespace-nowrap">
                <th className="px-3 py-2.5 font-medium">标题</th>
                <th className="px-3 py-2.5 font-medium">分类</th>
                <th className="px-3 py-2.5 font-medium">状态</th>
                <th className="px-3 py-2.5 font-medium">作者</th>
                <th className="px-3 py-2.5 font-medium">更新时间</th>
                <th className="px-3 py-2.5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => {
                const isDeleted = Boolean(article.deletedAt);
                const canView =
                  !isDeleted && article.status === CONTENT_STATUS.published;
                const authorName =
                  article.author.displayName ?? article.author.username ?? "—";

                return (
                  <tr
                    key={article.id}
                    className="whitespace-nowrap border-b last:border-0"
                  >
                    <td className="max-w-[220px] truncate px-3 py-2 font-medium">
                      {article.title}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 text-muted-foreground">
                      {article.categoryId ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClassName(article) ?? "bg-secondary text-secondary-foreground"}`}
                      >
                        {statusLabel(article)}
                      </span>
                    </td>
                    <td className="max-w-[100px] truncate px-3 py-2 text-muted-foreground">
                      {authorName}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDateTime(article.updatedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-nowrap items-center justify-end gap-1.5">
                        {canView ? (
                          <AdminContentPreviewDialog
                            targetType={TARGET_TYPES.post}
                            targetId={article.id}
                          />
                        ) : null}
                        {!isDeleted ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => onEdit(article.id)}
                          >
                            编辑
                          </Button>
                        ) : null}
                        {!isDeleted &&
                        article.status !== CONTENT_STATUS.published ? (
                          <AdminConfirmButton
                            action={publishContentArticleAction}
                            hiddenFields={{ module, articleId: article.id }}
                            label="发布"
                            confirmTitle="发布文章？"
                            confirmDescription="发布后将出现在前台列表。"
                            className="h-7 px-2 text-xs"
                          />
                        ) : null}
                        {!isDeleted &&
                        article.status === CONTENT_STATUS.published ? (
                          <AdminConfirmButton
                            action={hideContentArticleAction}
                            hiddenFields={{ module, articleId: article.id }}
                            label="隐藏"
                            confirmTitle="隐藏文章？"
                            confirmDescription="隐藏后前台将不可见。"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          />
                        ) : null}
                        {!isDeleted ? (
                          <AdminConfirmButton
                            action={deleteContentArticleAction}
                            hiddenFields={{ module, articleId: article.id }}
                            label="删除"
                            confirmTitle="删除文章？"
                            confirmDescription="将软删除此文章。"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
