"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import {
  deleteContentArticleAction,
  hideContentArticleAction,
  publishContentArticleAction,
} from "@/lib/content/cmsActions";
import { CONTENT_STATUS, CONTENT_STATUS_LABELS } from "@/constants/contentStatus";
import { ROUTES } from "@/constants/routes";
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
  const detailHref =
    module === "study" ? ROUTES.study.detail : ROUTES.life.detail;
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
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="px-4 py-3 font-medium">分类</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">更新时间</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => {
                const isDeleted = Boolean(article.deletedAt);
                const canView =
                  !isDeleted && article.status === CONTENT_STATUS.published;

                return (
                  <tr key={article.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{article.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {article.categoryId ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName(article) ?? "bg-secondary text-secondary-foreground"}`}
                      >
                        {statusLabel(article)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(article.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {canView ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={detailHref(article.id)} target="_blank">
                              查看
                            </Link>
                          </Button>
                        ) : null}
                        {!isDeleted ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
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
