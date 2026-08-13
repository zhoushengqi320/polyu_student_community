"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getAdminContentPreviewAction,
  type AdminContentPreview,
} from "@/lib/admin/actions";
import { RichContent } from "@/components/common/RichContent";
import { TARGET_TYPE_LABELS } from "@/constants/admin";
import { type TargetType } from "@/constants/reportReasons";
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
};

export function AdminContentPreviewDialog({
  targetType,
  targetId,
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
      });
      if (result.error || !result.data) {
        setPreview(null);
        setError(result.error ?? "预览加载失败");
        return;
      }
      setPreview(result.data);
    });
  }, [open, targetType, targetId]);

  const body = preview?.body || preview?.excerpt || "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="link" className="h-auto p-0 text-primary">
          查看内容
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {TARGET_TYPE_LABELS[targetType] ?? "内容"}预览
          </DialogTitle>
          <DialogDescription>
            仅在后台弹窗查看，不会跳转到前台页面。
          </DialogDescription>
        </DialogHeader>

        {pending && !preview ? (
          <p className="text-sm text-muted-foreground">加载中...</p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {preview ? (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {preview.module ? <span>模块：{preview.module}</span> : null}
              {preview.status ? <span>状态：{preview.status}</span> : null}
              {preview.deletedAt ? (
                <span className="text-destructive">已删除</span>
              ) : null}
            </div>
            {preview.title ? (
              <h3 className="text-base font-semibold">{preview.title}</h3>
            ) : null}
            {body ? (
              <RichContent content={body} className="leading-relaxed" />
            ) : (
              <p className="text-muted-foreground">（无正文）</p>
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
