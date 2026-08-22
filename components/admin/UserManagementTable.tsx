"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  banUserAction,
  unbanUserAction,
  verifyPolyuUserAction,
} from "@/lib/admin/actions";
import {
  adminActionInitialState,
  type AdminActionState,
} from "@/lib/admin/state";
import { USER_ACTIVITY_SILENT_THRESHOLD } from "@/constants/userActivity";
import {
  getOnlinePresenceSortKey,
  isUserOnline,
} from "@/constants/userPresence";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/constants/userRoles";
import { USER_ROLES } from "@/constants/userRoles";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/formatDate";
import { type AdminUserListItem } from "@/types/admin";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { EmailWhitelistPanel } from "@/components/admin/EmailWhitelistPanel";
import { ADMIN_TABLE, adminTruncateCell } from "@/components/admin/adminTableClasses";
import { type EmailWhitelistRow } from "@/lib/db/emailWhitelist";
import { cn } from "@/lib/utils/cn";
import { Users } from "lucide-react";

type UserManagementTableProps = {
  users: AdminUserListItem[];
  whitelistEntries?: EmailWhitelistRow[];
};

type UserSortField = "activity" | "createdAt" | "online";
type SortDirection = "asc" | "desc";

function SortableHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className,
}: {
  label: string;
  field: UserSortField;
  sortField: UserSortField;
  sortDirection: SortDirection;
  onSort: (field: UserSortField) => void;
  className?: string;
}) {
  const active = sortField === field;
  const Icon = active
    ? sortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5", !active && "opacity-50")} />
    </button>
  );
}

function sortUsers(
  users: AdminUserListItem[],
  sortField: UserSortField,
  sortDirection: SortDirection,
): AdminUserListItem[] {
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...users].sort((a, b) => {
    const aIsAdmin = a.role === USER_ROLES.admin;
    const bIsAdmin = b.role === USER_ROLES.admin;

    if (sortField === "activity") {
      if (aIsAdmin && !bIsAdmin) {
        return 1;
      }
      if (!aIsAdmin && bIsAdmin) {
        return -1;
      }
      const aScore = a.activity?.score ?? -1;
      const bScore = b.activity?.score ?? -1;
      return (aScore - bScore) * direction;
    }

    if (sortField === "online") {
      const aKey = getOnlinePresenceSortKey(a.lastSeenAt);
      const bKey = getOnlinePresenceSortKey(b.lastSeenAt);
      if (aKey !== bKey) {
        return (aKey - bKey) * direction;
      }

      const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return (aTime - bTime) * direction;
    }

    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return (aTime - bTime) * direction;
  });
}

function UserActionForm({
  userId,
  action,
  label,
  variant = "outline",
}: {
  userId: string;
  action: typeof banUserAction;
  label: string;
  variant?: "default" | "outline" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(
    action,
    adminActionInitialState,
  );

  return (
    <form action={formAction} className="inline-flex items-center gap-1">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "处理中..." : label}
      </Button>
      {state.error ? (
        <span className="sr-only">{state.error}</span>
      ) : state.success ? (
        <span className="sr-only">{state.success}</span>
      ) : null}
    </form>
  );
}

function activityBadgeClass(score: number): string | undefined {
  if (score < USER_ACTIVITY_SILENT_THRESHOLD) {
    return "bg-muted text-muted-foreground";
  }
  if (score >= 80) {
    return "bg-green-100 text-green-800";
  }
  if (score >= 60) {
    return "bg-blue-100 text-blue-800";
  }
  if (score >= 40) {
    return "bg-secondary text-secondary-foreground";
  }
  return "bg-amber-100 text-amber-800";
}

function ActivityCell({ user }: { user: AdminUserListItem }) {
  if (user.role === USER_ROLES.admin || !user.activity) {
    return <span className="text-xs text-muted-foreground">不参与</span>;
  }

  const { activity } = user;
  const breakdown = activity.breakdown;
  const title = [
    `访问 ${breakdown.visit}`,
    `贡献 ${breakdown.creation}`,
    `互动 ${breakdown.interaction}`,
    `质量 ${breakdown.quality}`,
    breakdown.penalty > 0 ? `惩罚 −${breakdown.penalty}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "space-y-1",
        activity.score < USER_ACTIVITY_SILENT_THRESHOLD &&
          "text-muted-foreground",
      )}
      title={title}
    >
      <span className="inline-flex items-center gap-2">
        <span className="font-medium tabular-nums">{activity.score}</span>
        <TagBadge
          label={activity.tierLabel}
          className={activityBadgeClass(activity.score)}
        />
      </span>
    </div>
  );
}

function OnlineStatusCell({ user }: { user: AdminUserListItem }) {
  const online = isUserOnline(user.lastSeenAt);

  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-green-700">
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-hidden="true" />
        在线
      </span>
    );
  }

  if (user.lastSeenAt) {
    return (
      <span
        className="whitespace-nowrap text-xs text-muted-foreground"
        title={formatDateTime(user.lastSeenAt)}
      >
        离线 · {formatRelativeTime(user.lastSeenAt)}
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">无记录</span>;
}

function LastActiveCell({ user }: { user: AdminUserListItem }) {
  if (user.role === USER_ROLES.admin) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  if (!user.activity?.lastActiveAt) {
    return <span className="text-xs text-muted-foreground">无记录</span>;
  }

  return (
    <span
      className={cn(
        "text-xs",
        user.activity.score < USER_ACTIVITY_SILENT_THRESHOLD
          ? "text-muted-foreground"
          : "text-foreground",
      )}
      title={formatDateTime(user.activity.lastActiveAt)}
    >
      {formatRelativeTime(user.activity.lastActiveAt)}
    </span>
  );
}

export function UserManagementTable({
  users,
  whitelistEntries = [],
}: UserManagementTableProps) {
  const [sortField, setSortField] = useState<UserSortField>("activity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(field: UserSortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("desc");
  }

  const sortedUsers = useMemo(
    () => sortUsers(users, sortField, sortDirection),
    [users, sortField, sortDirection],
  );

  return (
    <div className="space-y-6">
      <EmailWhitelistPanel entries={whitelistEntries} />

      <p className="text-xs text-muted-foreground">
        活跃度仅后台可见，按近 90 天访问与互动计算；管理员账号不参与计分。在线状态依据最近
        35 分钟内的心跳记录；点击表头可排序。
      </p>

      {sortedUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="暂无用户数据"
          description="接入 Supabase 后将在此展示用户列表。"
        />
      ) : (
        <div className={ADMIN_TABLE.wrap}>
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className={ADMIN_TABLE.headCell}>用户</th>
                <th className={ADMIN_TABLE.headCell}>绑定邮箱</th>
                <th className={ADMIN_TABLE.headCell}>角色</th>
                <th className={ADMIN_TABLE.headCell}>状态</th>
                <th className={ADMIN_TABLE.headCell}>
                  <SortableHeader
                    label="在线情况"
                    field="online"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={ADMIN_TABLE.headCell}>
                  <SortableHeader
                    label="活跃度"
                    field="activity"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={ADMIN_TABLE.headCell}>最近活跃</th>
                <th className={ADMIN_TABLE.headCell}>举报警告</th>
                <th className={ADMIN_TABLE.headCell}>
                  <SortableHeader
                    label="注册时间"
                    field="createdAt"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className={`${ADMIN_TABLE.headCell} text-right`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => {
                const isAdmin = user.role === USER_ROLES.admin;
                const isBanned =
                  user.status === "banned" ||
                  Boolean(
                    user.bannedUntil && new Date(user.bannedUntil) > new Date(),
                  );
                const hasReportWarning = user.reporterWarningCount > 0;
                const canVerify = user.role === USER_ROLES.user;
                const isSilent =
                  !isAdmin &&
                  user.activity &&
                  user.activity.score < USER_ACTIVITY_SILENT_THRESHOLD;

                return (
                  <tr
                    key={user.id}
                    className={cn(ADMIN_TABLE.row, isSilent && "bg-muted/20")}
                  >
                    <td className={ADMIN_TABLE.cell}>
                      <div className="flex max-w-[260px] items-center gap-2">
                        <UserAvatar
                          src={user.avatarUrl}
                          name={user.displayName ?? user.username}
                          size="sm"
                        />
                        <span
                          className={cn(
                            "min-w-0 truncate font-medium",
                            isSilent && "text-muted-foreground",
                          )}
                          title={user.displayName ?? user.username}
                        >
                          {user.displayName ?? user.username}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          @{user.username}
                        </span>
                        {isAdmin ? (
                          <TagBadge
                            label="管理员"
                            className="shrink-0 bg-primary/10 text-primary"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className={adminTruncateCell("max-w-[200px]")}>
                      {user.email ? (
                        <span className="font-mono text-xs" title={user.email}>
                          {user.email}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={ADMIN_TABLE.cell}>
                      <TagBadge label={USER_ROLE_LABELS[user.role]} />
                    </td>
                    <td className={ADMIN_TABLE.cell}>
                      <span
                        className="inline-flex items-center gap-2"
                        title={
                          user.bannedUntil &&
                          new Date(user.bannedUntil) > new Date()
                            ? `限制至 ${formatDateTime(user.bannedUntil)}`
                            : undefined
                        }
                      >
                        <TagBadge
                          label={USER_STATUS_LABELS[user.status]}
                          className={
                            isBanned
                              ? "bg-destructive/10 text-destructive"
                              : undefined
                          }
                        />
                        {user.bannedUntil &&
                        new Date(user.bannedUntil) > new Date() ? (
                          <span className="text-xs text-muted-foreground">
                            至 {formatDateTime(user.bannedUntil)}
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className={ADMIN_TABLE.cell}>
                      <OnlineStatusCell user={user} />
                    </td>
                    <td className={ADMIN_TABLE.cell}>
                      <ActivityCell user={user} />
                    </td>
                    <td className={ADMIN_TABLE.cell}>
                      <LastActiveCell user={user} />
                    </td>
                    <td className={ADMIN_TABLE.cell}>
                      {hasReportWarning ? (
                        <TagBadge
                          label={`${user.reporterWarningCount} 次`}
                          className="bg-amber-100 text-amber-800"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className={`${ADMIN_TABLE.cell} text-muted-foreground`}>
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className={ADMIN_TABLE.cellRight}>
                      {isAdmin ? (
                        <span className="text-xs text-muted-foreground">
                          管理员账号
                        </span>
                      ) : (
                        <div className={ADMIN_TABLE.actions}>
                          {canVerify ? (
                            <UserActionForm
                              userId={user.id}
                              action={verifyPolyuUserAction}
                              label="理大认证"
                            />
                          ) : null}
                          {isBanned ? (
                            <UserActionForm
                              userId={user.id}
                              action={unbanUserAction}
                              label="解封"
                            />
                          ) : (
                            <UserActionForm
                              userId={user.id}
                              action={banUserAction}
                              label="封禁"
                              variant="destructive"
                            />
                          )}
                        </div>
                      )}
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
