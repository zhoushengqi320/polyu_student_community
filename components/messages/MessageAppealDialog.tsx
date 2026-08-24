"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp } from "lucide-react";
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
import { PendingOverlay } from "@/components/common/PendingOverlay";
import { MESSAGE_VIOLATION_LABEL } from "@/constants/messaging";
import {
  submitMessageAppealAction,
  type MessageActionState,
} from "@/lib/messages/actions";

type MessageAppealDialogProps = {
  messageId: string;
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const initialState: MessageActionState = {};

export function MessageAppealDialog({
  messageId,
  conversationId,
  open,
  onOpenChange,
}: MessageAppealDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    submitMessageAppealAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
      const timer = window.setTimeout(() => {
        onOpenChange(false);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [state.success, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>申诉违规处理</DialogTitle>
          <DialogDescription>
            该私信已被管理员判定为违规并显示为「{MESSAGE_VIOLATION_LABEL}
            」。请说明您认为处理不当的理由，管理员将重新审核。
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="messageId" value={messageId} />
          <input type="hidden" name="conversationId" value={conversationId} />

          <div className="space-y-2">
            <Label htmlFor={`appeal-note-${messageId}`}>申诉理由</Label>
            <textarea
              id={`appeal-note-${messageId}`}
              name="appealNote"
              rows={4}
              maxLength={500}
              required
              minLength={5}
              placeholder="请具体说明为何认为该私信不应被判定违规（至少 5 字）"
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

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
              <CircleHelp className="mr-1 h-4 w-4" />
              {pending ? "提交中..." : "提交申诉"}
            </Button>
          </DialogFooter>
        </form>
        <PendingOverlay active={pending} label="提交中…" />
      </DialogContent>
    </Dialog>
  );
}
