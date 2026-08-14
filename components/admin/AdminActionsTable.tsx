"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/utils/formatDate";
import { getAdminActionLabel } from "@/constants/admin";
import { ROUTES } from "@/constants/routes";
import { type AdminActionLogWithAdmin } from "@/types/report";
import { TagBadge } from "@/components/common/TagBadge";
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

function ContentBackupButton({
  item,
}: {
  item: AdminActionLogWithAdmin;
}) {
  const [open, setOpen] = useState(false);
  const backup = item.metadata?.contentBackup;
  if (!backup || typeof backup !== "object") {
    return null;
  }

  const title =
    (typeof item.metadata?.title === "string" && item.metadata.title) ||
    (typeof (backup as { title?: unknown }).title === "string"
      ? ((backup as { title: string }).title)
      : null) ||
    "内容备份";

  const body =
    typeof (backup as { content?: unknown }).content === "string"
      ? (backup as { content: string }).content
      : JSON.stringify(backup, null, 2);

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        查看备份
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
            {body}
          </pre>
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
      return (
        label.includes(q) ||
        adminName.includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.targetType.toLowerCase().includes(q) ||
        item.targetId.toLowerCase().includes(q)
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
          placeholder="检索操作、管理员、目标类型或 ID…"
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
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">操作</th>
                <th className="px-4 py-3 font-medium">管理员</th>
                <th className="px-4 py-3 font-medium">目标</th>
                <th className="px-4 py-3 font-medium">时间</th>
                <th className="px-4 py-3 font-medium">备份</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <TagBadge label={getAdminActionLabel(item.action)} />
                  </td>
                  <td className="px-4 py-3">
                    {item.admin.displayName ?? item.admin.username ?? "系统"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.targetType} · {item.targetId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ContentBackupButton item={item} />
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
