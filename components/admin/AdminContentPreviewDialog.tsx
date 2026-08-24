"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getAdminContentPreviewAction,
  type AdminContentPreview,
} from "@/lib/admin/actions";
import { RichContent } from "@/components/common/RichContent";
import { AdminMessageThreadPreview } from "@/components/admin/AdminMessageThreadPreview";
import { QuotedMessageBody } from "@/components/messages/QuotedMessageBody";
import { TARGET_TYPE_LABELS } from "@/constants/admin";
import { TARGET_TYPES, type TargetType } from "@/constants/reportReasons";
import { formatDate } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AdminContentPreviewDialogProps = {
  targetType: TargetType;
  targetId: string;
  reportId?: string;
};

function EngagementList({
  title,
  users,
}: {
  title: string;
  users: AdminContentPreview["likeUsers"];
}) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <h4 className="text-sm font-medium">
        {title}
        <span className="ml-2 text-muted-foreground">({users.length})</span>
      </h4>
      {users.length === 0 ? (
        <p className="text-xs text-muted-foreground">暂无记录</p>
      ) : (
        <ul className="max-h-40 space-y-1.5 overflow-y-auto text-xs">
          {users.map((user) => (
            <li
              key={`${user.id}-${user.at}`}
              className="flex flex-wrap items-baseline justify-between gap-2"
            >
              <span>
                {user.displayName}
                {user.username ? (
                  <span className="ml-1 text-muted-foreground">
                    @{user.username}
                  </span>
                ) : null}
                {user.isVisitor ? (
                  <span className="ml-1 text-muted-foreground">（访客）</span>
                ) : null}
              </span>
              <span className="text-muted-foreground">{formatDate(user.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminContentPreviewDialog({
  targetType,
  targetId,
  reportId,
}: AdminContentPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<AdminContentPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await getAdminContentPreviewAction({
        targetType,
        targetId,
        reportId,
      });
      if (result.error || !result.data) {
        setPreview(null);
        setError(result.error ?? "预览加载失败");
        return;
      }
      setPreview(result.data);
    });
  }, [open, targetType, targetId, reportId]);

  const body = preview?.body || preview?.excerpt || "";
  const messageThread = preview?.messageThread ?? [];
  const showMessageThread =
    preview?.targetType === TARGET_TYPES.message && messageThread.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="link" className="h-auto p-0 text-primary">
          查看内容
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {TARGET_TYPE_LABELS[targetType] ?? "内容"}预览
          </DialogTitle>
          <DialogDescription>
            仅在后台弹窗查看，不会跳转到前台页面。可查看点赞与浏览用户。
          </DialogDescription>
        </DialogHeader>

        {pending && !preview ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {preview ? (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {preview.module ? <span>模块：{preview.module}</span> : null}
              {preview.status ? <span>状态：{preview.status}</span> : null}
              {preview.deletedAt ? (
                <span className="text-destructive">已删除</span>
              ) : null}
            </div>
            {preview.authorName || preview.ownerId ? (
              <p className="text-sm">
                <span className="text-muted-foreground">作者：</span>
                {preview.authorName ?? "未知用户"}
                {preview.ownerId ? (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    ({preview.ownerId.slice(0, 8)}…)
                  </span>
                ) : null}
              </p>
            ) : null}
            {preview.title ? (
              <h3 className="text-base font-semibold">{preview.title}</h3>
            ) : null}
            {showMessageThread ? (
              <AdminMessageThreadPreview messages={messageThread} />
            ) : preview.targetType === TARGET_TYPES.message && body ? (
              <QuotedMessageBody body={body} />
            ) : body ? (
              <RichContent content={body} className="leading-relaxed" />
            ) : (
              <p className="text-muted-foreground">（无正文）</p>
            )}

            {preview.targetType === TARGET_TYPES.message ? null : (
              <div className="grid gap-3 sm:grid-cols-2">
                <EngagementList title="点赞用户" users={preview.likeUsers} />
                <EngagementList title="收藏用户" users={preview.favoriteUsers} />
                <div className="sm:col-span-2">
                  <EngagementList title="浏览用户" users={preview.viewUsers} />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              ID: {preview.targetId}
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
