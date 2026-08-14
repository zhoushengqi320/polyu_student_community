"use client";

import { useActionState } from "react";
import {
  banUserAction,
  unbanUserAction,
  verifyPolyuUserAction,
} from "@/lib/admin/actions";
import {
  adminActionInitialState,
  type AdminActionState,
} from "@/lib/admin/state";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/constants/userRoles";
import { USER_ROLES } from "@/constants/userRoles";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type AdminUserListItem } from "@/types/admin";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { EmailWhitelistPanel } from "@/components/admin/EmailWhitelistPanel";
import { type EmailWhitelistRow } from "@/lib/db/emailWhitelist";
import { Users } from "lucide-react";

type UserManagementTableProps = {
  users: AdminUserListItem[];
  whitelistEntries?: EmailWhitelistRow[];
};

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.error) {
    return <p className="text-sm text-destructive">{state.error}</p>;
  }

  if (state.success) {
    return <p className="text-sm text-green-600">{state.success}</p>;
  }

  return null;
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
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "处理中..." : label}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}

export function UserManagementTable({
  users,
  whitelistEntries = [],
}: UserManagementTableProps) {
  return (
    <div className="space-y-6">
      <EmailWhitelistPanel entries={whitelistEntries} />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="暂无用户数据"
          description="接入 Supabase 后将在此展示用户列表。"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">用户</th>
                <th className="px-4 py-3 font-medium">绑定邮箱</th>
                <th className="px-4 py-3 font-medium">角色</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">举报警告</th>
                <th className="px-4 py-3 font-medium">注册时间</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isAdmin = user.role === USER_ROLES.admin;
                const isBanned =
                  user.status === "banned" ||
                  Boolean(
                    user.bannedUntil && new Date(user.bannedUntil) > new Date(),
                  );
                const hasReportWarning = user.reporterWarningCount > 0;
                const canVerify = user.role === USER_ROLES.user;

                return (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={user.avatarUrl}
                          name={user.displayName ?? user.username}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="font-medium">
                            {user.displayName ?? user.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.email ? (
                        <span className="font-mono text-xs">{user.email}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TagBadge label={USER_ROLE_LABELS[user.role]} />
                    </td>
                    <td className="px-4 py-3">
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          限制至 {formatDateTime(user.bannedUntil)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {hasReportWarning ? (
                        <TagBadge
                          label={`${user.reporterWarningCount} 次`}
                          className="bg-amber-100 text-amber-800"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <span className="block text-right text-xs text-muted-foreground">
                          管理员账号
                        </span>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-2">
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
