"use client";

import { useEffect, useState, useTransition } from "react";
import { getCommunityRulesContentAction } from "@/lib/legal/actions";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

type CommunityRulesDialogProps = {
  triggerClassName?: string;
  triggerLabel?: string;
  /** 使用自定义触发元素时传入 */
  children?: React.ReactNode;
};

export function CommunityRulesDialog({
  triggerClassName,
  triggerLabel = "查看社区规则",
  children,
}: CommunityRulesDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("社区规则");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || body) {
      return;
    }
    startTransition(async () => {
      const result = await getCommunityRulesContentAction();
      if (!result) {
        setError("暂时无法加载社区规则");
        return;
      }
      setTitle(result.title);
      setBody(result.body);
      setError(null);
    });
  }, [open, body]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <button
            type="button"
            className={cn(
              "underline underline-offset-2 hover:text-foreground",
              triggerClassName,
            )}
          >
            {triggerLabel}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            弹窗查看，不会离开当前页面，已输入内容会保留。
          </DialogDescription>
        </DialogHeader>
        {pending && !body ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {body ? <LegalDocumentView content={body} enableAnchors /> : null}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
