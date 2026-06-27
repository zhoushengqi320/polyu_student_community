"use client";

import { formatDateTime } from "@/lib/utils/formatDate";
import { getAdminActionLabel } from "@/constants/admin";
import { type AdminActionLogWithAdmin } from "@/types/report";
import { TagBadge } from "@/components/common/TagBadge";

type AdminActionsTableProps = {
  actions: AdminActionLogWithAdmin[];
};

export function AdminActionsTable({ actions }: AdminActionsTableProps) {
  if (actions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        暂无操作记录。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 font-medium">操作</th>
            <th className="px-4 py-3 font-medium">管理员</th>
            <th className="px-4 py-3 font-medium">目标</th>
            <th className="px-4 py-3 font-medium">时间</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <TagBadge label={getAdminActionLabel(item.action)} />
              </td>
              <td className="px-4 py-3">
                {item.admin.displayName ?? item.admin.username}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.targetType} · {item.targetId.slice(0, 8)}…
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
