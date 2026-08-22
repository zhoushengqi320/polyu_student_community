"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/utils/formatDate";
import { getAdminActionLabel, TARGET_TYPE_LABELS } from "@/constants/admin";
import { ROUTES } from "@/constants/routes";
import { type TargetType } from "@/constants/reportReasons";
import { type AdminActionLogWithAdmin } from "@/types/report";
import {
  getAdminActionLogDetailAction,
} from "@/lib/admin/actions";
import { type AdminActionLogDetail } from "@/lib/admin/actionLogDetail";
import { RichContent } from "@/components/common/RichContent";
import { TagBadge } from "@/components/common/TagBadge";
import { ADMIN_TABLE, adminTruncateCell } from "@/components/admin/adminTableClasses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AdminActionsTableProps = {
  actions: AdminActionLogWithAdmin[];
  page?: number;
  pageSize?: number;
  total?: number;
  query?: string;
};

function readMetaString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function ActionLogSummary({ item }: { item: AdminActionLogWithAdmin }) {
  const meta = item.metadata;
  const title =
    readMetaString(meta, "title") ??
    readMetaString(meta, "targetLabel");
  const excerpt = readMetaString(meta, "excerpt");
  const reason = readMetaString(meta, "reason");
  const targetLabel =
    TARGET_TYPE_LABELS[item.targetType as TargetType] ?? item.targetType;

  const summary =
    title ??
    excerpt ??
    reason ??
    `${targetLabel} · ${item.targetId.slice(0, 8)}…`;

  return (
    <span
      className="block max-w-[360px] truncate"
      title={[targetLabel, title, excerpt, reason].filter(Boolean).join(" · ")}
    >
      <span className="text-xs text-muted-foreground">{targetLabel}</span>
      {" · "}
      <span>{summary}</span>
    </span>
  );
}

function ActionDetailDialog({ item }: { item: AdminActionLogWithAdmin }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<AdminActionLogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  const fallbackTitle =
    readMetaString(item.metadata, "title") ??
    readMetaString(item.metadata, "targetLabel") ??
    getAdminActionLabel(item.action);

  useEffect(() => {
    if (!open) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await getAdminActionLogDetailAction({
        targetType: item.targetType,
        targetId: item.targetId,
        metadata: item.metadata,
      });

      if (result.error || !result.data) {
        setDetail(null);
        setError(result.error ?? "详情加载失败");
        return;
      }

      setDetail(result.data);
    });
  }, [open, item.targetType, item.targetId, item.metadata]);

  const dialogTitle = detail?.title ?? fallbackTitle;

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        查看详情
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {TARGET_TYPE_LABELS[item.targetType as TargetType] ??
                item.targetType}{" "}
              · {item.targetId}
            </p>

            {loading && !detail ? (
              <p className="text-muted-foreground">加载中…</p>
            ) : null}

            {error ? <p className="text-destructive">{error}</p> : null}

            {detail?.sourceNote ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {detail.sourceNote}
              </p>
            ) : null}

            {detail?.reason ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">操作理由</p>
                <p className="mt-1 whitespace-pre-wrap">{detail.reason}</p>
              </div>
            ) : null}

            {detail?.appealNote ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">用户申诉理由</p>
                <p className="mt-1 whitespace-pre-wrap">{detail.appealNote}</p>
              </div>
            ) : null}

            {detail ? (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {detail.module ? <span>模块：{detail.module}</span> : null}
                {detail.status ? <span>状态：{detail.status}</span> : null}
                {detail.deletedAt ? (
                  <span className="text-destructive">已删除</span>
                ) : null}
                {detail.authorName ? <span>作者：{detail.authorName}</span> : null}
              </div>
            ) : null}

            {detail?.excerpt && !detail.body ? (
              <p className="whitespace-pre-wrap text-muted-foreground">
                {detail.excerpt}
              </p>
            ) : null}

            {detail?.profileSnapshot ? (
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
                {JSON.stringify(detail.profileSnapshot, null, 2)}
              </pre>
            ) : null}

            {detail?.body ? (
              <div className="rounded-md border bg-muted/40 p-3">
                <RichContent content={detail.body} className="text-sm leading-relaxed" />
              </div>
            ) : null}

            {detail?.source === "none" && !loading ? (
              <p className="text-muted-foreground">
                无法恢复该条记录的目标内容详情。
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminActionsTable({
  actions,
  page = 1,
  pageSize = 20,
  total,
  query = "",
}: AdminActionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(query);

  const resolvedTotal = total ?? actions.length;

  const filteredFallback = useMemo(() => {
    if (total !== undefined) {
      return actions;
    }
    const q = searchValue.trim().toLowerCase();
    if (!q) {
      return actions;
    }
    return actions.filter((item) => {
      const label = getAdminActionLabel(item.action).toLowerCase();
      const adminName = (
        item.admin.displayName ??
        item.admin.username ??
        ""
      ).toLowerCase();
      const meta = item.metadata;
      const metaText = [
        readMetaString(meta, "title"),
        readMetaString(meta, "excerpt"),
        readMetaString(meta, "reason"),
        readMetaString(meta, "targetLabel"),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        label.includes(q) ||
        adminName.includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.targetType.toLowerCase().includes(q) ||
        item.targetId.toLowerCase().includes(q) ||
        metaText.includes(q)
      );
    });
  }, [actions, searchValue, total]);

  const pageItems =
    total !== undefined
      ? actions
      : filteredFallback.slice((page - 1) * pageSize, page * pageSize);

  const displayTotal = total !== undefined ? resolvedTotal : filteredFallback.length;
  const displayPages = Math.max(1, Math.ceil(displayTotal / pageSize));

  function pushActionsQuery(next: { q?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "actions");
    const q = next.q ?? searchValue;
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    const nextPage = next.page ?? 1;
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }
    startTransition(() => {
      router.push(`${ROUTES.admin}?${params.toString()}`);
    });
  }

  if (actions.length === 0 && !query) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        暂无操作记录。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          pushActionsQuery({ q: searchValue, page: 1 });
        }}
      >
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="检索操作、管理员、内容标题、理由或 ID…"
          className="max-w-md"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "搜索中…" : "搜索"}
        </Button>
        {query ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setSearchValue("");
              pushActionsQuery({ q: "", page: 1 });
            }}
          >
            清除
          </Button>
        ) : null}
      </form>

      {pageItems.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          没有匹配的操作记录。
        </p>
      ) : (
        <div className={ADMIN_TABLE.wrap}>
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className={ADMIN_TABLE.headCell}>操作</th>
                <th className={ADMIN_TABLE.headCell}>管理员</th>
                <th className={ADMIN_TABLE.headCell}>内容摘要</th>
                <th className={ADMIN_TABLE.headCell}>时间</th>
                <th className={ADMIN_TABLE.headCell}>详情</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className={ADMIN_TABLE.row}>
                  <td className={ADMIN_TABLE.cell}>
                    <TagBadge label={getAdminActionLabel(item.action)} />
                  </td>
                  <td className={adminTruncateCell("max-w-[120px]")}>
                    {item.admin.displayName ?? item.admin.username ?? "系统"}
                  </td>
                  <td className={ADMIN_TABLE.cell}>
                    <ActionLogSummary item={item} />
                  </td>
                  <td className={`${ADMIN_TABLE.cell} text-muted-foreground`}>
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className={ADMIN_TABLE.cell}>
                    <ActionDetailDialog item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {displayPages > 1 ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            第 {page} / {displayPages} 页 · 共 {displayTotal} 条
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || page <= 1}
              onClick={() => pushActionsQuery({ page: page - 1 })}
            >
              上一页
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || page >= displayPages}
              onClick={() => pushActionsQuery({ page: page + 1 })}
            >
              下一页
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
