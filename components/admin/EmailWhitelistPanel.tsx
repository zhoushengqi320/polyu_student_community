"use client";

import { useActionState } from "react";
import {
  addEmailWhitelistAction,
  removeEmailWhitelistAction,
} from "@/lib/admin/actions";
import {
  adminActionInitialState,
  type AdminActionState,
} from "@/lib/admin/state";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type EmailWhitelistRow } from "@/lib/db/emailWhitelist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagBadge } from "@/components/common/TagBadge";
import { ADMIN_TABLE, adminTruncateCell } from "@/components/admin/adminTableClasses";
import { EmptyState } from "@/components/common/EmptyState";
import { Mail } from "lucide-react";

type EmailWhitelistPanelProps = {
  entries: EmailWhitelistRow[];
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

export function EmailWhitelistPanel({ entries }: EmailWhitelistPanelProps) {
  const [addState, addAction, addPending] = useActionState(
    addEmailWhitelistAction,
    adminActionInitialState,
  );

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div>
        <h3 className="text-base font-semibold">注册白名单</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          添加非理大邮箱后，对方注册可跳过验证码直接设密码；注册成功后名额作废并保留记录。已注册的白名单账号可使用密码或验证码登录。
        </p>
      </div>

      <form action={addAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="whitelist-email">邮箱</Label>
          <Input
            id="whitelist-email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whitelist-note">备注（可选）</Label>
          <Input
            id="whitelist-note"
            name="note"
            placeholder="例如：外部测试 / 嘉宾"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={addPending} className="w-full sm:w-auto">
            {addPending ? "添加中..." : "加入白名单"}
          </Button>
        </div>
      </form>
      <ActionMessage state={addState} />

      {entries.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="暂无白名单"
          description="添加后，对应邮箱即可跳过验证码完成注册。"
        />
      ) : (
        <div className={ADMIN_TABLE.wrap}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className={ADMIN_TABLE.headCellCompact}>邮箱</th>
                <th className={ADMIN_TABLE.headCellCompact}>状态</th>
                <th className={ADMIN_TABLE.headCellCompact}>备注</th>
                <th className={ADMIN_TABLE.headCellCompact}>添加时间</th>
                <th className={ADMIN_TABLE.headCellCompact}>使用时间</th>
                <th className={`${ADMIN_TABLE.headCellCompact} text-right`}>操作</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <WhitelistRow key={entry.id} entry={entry} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function WhitelistRow({ entry }: { entry: EmailWhitelistRow }) {
  const [, formAction, pending] = useActionState(
    removeEmailWhitelistAction,
    adminActionInitialState,
  );
  const used = Boolean(entry.consumedAt);

  return (
    <tr className={ADMIN_TABLE.row}>
      <td className={adminTruncateCell("max-w-[200px]", true)}>
        <span className="font-mono text-xs" title={entry.email}>
          {entry.email}
        </span>
      </td>
      <td className={ADMIN_TABLE.cellCompact}>
        {used ? (
          <TagBadge label="已使用" className="bg-muted text-muted-foreground" />
        ) : (
          <TagBadge
            label="待注册"
            className="bg-emerald-100 text-emerald-800"
          />
        )}
      </td>
      <td className={adminTruncateCell("max-w-[140px]", true)}>
        {entry.note || "—"}
      </td>
      <td className={`${ADMIN_TABLE.cellCompact} text-muted-foreground`}>
        {formatDateTime(entry.createdAt)}
      </td>
      <td className={`${ADMIN_TABLE.cellCompact} text-muted-foreground`}>
        {entry.consumedAt ? formatDateTime(entry.consumedAt) : "—"}
      </td>
      <td className={ADMIN_TABLE.cellRight}>
        {used ? (
          <span className="text-xs text-muted-foreground">保留记录</span>
        ) : (
          <form action={formAction} className="inline-flex items-center gap-1">
            <input type="hidden" name="id" value={entry.id} />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={pending}
            >
              {pending ? "删除中..." : "删除"}
            </Button>
          </form>
        )}
      </td>
    </tr>
  );
}
