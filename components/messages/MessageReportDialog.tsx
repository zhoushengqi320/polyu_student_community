"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CommunityRulesDialog } from "@/components/legal/CommunityRulesDialog";
import { PendingOverlay } from "@/components/common/PendingOverlay";
import { MESSAGE_REPORT_CONTEXT_RADIUS } from "@/constants/messaging";
import { REPORT_REASONS } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import {
  createMessageReportAction,
  type MessageActionState,
} from "@/lib/messages/actions";
import { formatMessageBodyForReport } from "@/lib/messages/formatMessageReport";
import { getMessageSenderLabel } from "@/lib/messages/formatMessageQuote";
import { type MessageWithSender } from "@/types/message";

type MessageReportDialogProps = {
  message: MessageWithSender;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoggedIn: boolean;
};

const initialState: MessageActionState = {};

export function MessageReportDialog({
  message,
  open,
  onOpenChange,
  isLoggedIn,
}: MessageReportDialogProps) {
  const [state, formAction, pending] = useActionState(
    createMessageReportAction,
    initialState,
  );
  const [includeContext, setIncludeContext] = useState(false);

  useEffect(() => {
    if (state.success) {
      const timer = window.setTimeout(() => {
        onOpenChange(false);
        setIncludeContext(false);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [state.success, onOpenChange]);

  const preview = formatMessageBodyForReport(message);
  const senderName = getMessageSenderLabel(message);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>举报私信</DialogTitle>
          <DialogDescription>
            举报后将由管理员审核。恶意举报可能导致账号受限。处理依据见
            <CommunityRulesDialog
              triggerLabel="社区规则"
              triggerClassName="mx-1"
            />
            。
          </DialogDescription>
        </DialogHeader>

        {!isLoggedIn ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">举报需要先登录。</p>
            <Button asChild>
              <Link href={ROUTES.login}>去登录</Link>
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="messageId" value={message.id} />

            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">被举报消息</p>
              <p className="mt-1 font-medium">{senderName}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                {preview}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`reason-${message.id}`}>举报原因</Label>
              <select
                id={`reason-${message.id}`}
                name="reason"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  请选择
                </option>
                {REPORT_REASONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`description-${message.id}`}>
                补充说明（可选）
              </Label>
              <textarea
                id={`description-${message.id}`}
                name="description"
                rows={3}
                maxLength={500}
                placeholder="简要说明举报原因，便于管理员判断"
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-start gap-2 text-sm leading-6">
              <input
                type="checkbox"
                name="includeContext"
                value="on"
                checked={includeContext}
                onChange={(event) => setIncludeContext(event.target.checked)}
                className="mt-1"
              />
              <span>
                附带该消息前后各 {MESSAGE_REPORT_CONTEXT_RADIUS}{" "}
                条上下文供管理员审核（仅管理员可见，不会通知对方）
              </span>
            </label>

            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-green-600">{state.success}</p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                <Flag className="mr-1 h-4 w-4" />
                {pending ? "提交中..." : "提交举报"}
              </Button>
            </DialogFooter>
          </form>
        )}
        <PendingOverlay active={pending} label="提交中…" />
      </DialogContent>
    </Dialog>
  );
}
