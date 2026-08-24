"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  REPORT_REASONS,
  TARGET_TYPES,
  type TargetType,
} from "@/constants/reportReasons";
import { CommunityRulesDialog } from "@/components/legal/CommunityRulesDialog";
import { PendingOverlay } from "@/components/common/PendingOverlay";
import { ROUTES } from "@/constants/routes";
import {
  createReportAction,
  type InteractionActionState,
} from "@/lib/interaction/actions";

type ReportDialogProps = {
  targetType: TargetType;
  targetId: string;
  isLoggedIn: boolean;
  /** 内容作者 id：与当前用户相同时隐藏举报 */
  ownerId?: string | null;
  currentUserId?: string | null;
  revalidatePath?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "destructive";
  triggerSize?: "default" | "sm" | "lg" | "icon";
};

const initialState: InteractionActionState = {};

export function ReportDialog({
  targetType,
  targetId,
  isLoggedIn,
  ownerId,
  currentUserId,
  revalidatePath,
  triggerLabel = "举报",
  triggerVariant = "ghost",
  triggerSize = "sm",
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, formAction, pending] = useActionState(createReportAction, initialState);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  if (ownerId && currentUserId && ownerId === currentUserId) {
    return null;
  }

  const targetLabelMap: Record<TargetType, string> = {
    [TARGET_TYPES.post]: "帖子",
    [TARGET_TYPES.comment]: "评论",
    [TARGET_TYPES.course]: "课程",
    [TARGET_TYPES.course_review]: "课程评价",
    [TARGET_TYPES.food_place]: "地点",
    [TARGET_TYPES.food_recommendation]: "推荐",
    [TARGET_TYPES.market_listing]: "闲置",
    [TARGET_TYPES.buddy_post]: "找搭子内容",
    [TARGET_TYPES.profile]: "用户资料",
    [TARGET_TYPES.message]: "私信",
  };
  const targetLabel = targetLabelMap[targetType];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className="gap-1.5">
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>举报{targetLabel}</DialogTitle>
          <DialogDescription>
            请选择举报原因。我们会尽快审核处理，恶意举报可能导致账号受限。处理依据见
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
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            {revalidatePath ? (
              <input type="hidden" name="revalidatePath" value={revalidatePath} />
            ) : null}

            <div className="space-y-2">
              <Label htmlFor={`reason-${targetId}`}>举报原因</Label>
              <select
                id={`reason-${targetId}`}
                name="reason"
                required
                defaultValue=""
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  请选择原因
                </option>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`description-${targetId}`}>补充说明（可选）</Label>
              <textarea
                id={`description-${targetId}`}
                name="description"
                rows={3}
                maxLength={500}
                placeholder="请简要说明举报理由..."
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {state.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}

            {state.success ? (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                {state.success}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "提交中..." : "提交举报"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
      {mounted && pending
        ? createPortal(<PendingOverlay active label="提交中…" />, document.body)
        : null}
    </Dialog>
  );
}
