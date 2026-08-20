"use client";

import { useActionState, useEffect, useState } from "react";
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
  adminActionInitialState,
  type AdminActionState,
} from "@/lib/admin/state";
import { ADMIN_REVIEW_REASON_MAX } from "@/lib/admin/reviewReason";
import { cn } from "@/lib/utils/cn";

type AdminConfirmButtonProps = {
  label: string;
  confirmTitle: string;
  confirmDescription: string;
  action: (
    prevState: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
  hiddenFields: Record<string, string>;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
  className?: string;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
};

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.error) {
    return <p className="text-xs text-destructive">{state.error}</p>;
  }
  if (state.success) {
    return <p className="text-xs text-green-600">{state.success}</p>;
  }
  return null;
}

export function AdminConfirmButton({
  label,
  confirmTitle,
  confirmDescription,
  action,
  hiddenFields,
  variant = "destructive",
  disabled = false,
  className,
  requireReason = false,
  reasonLabel = "操作理由",
  reasonPlaceholder = "请说明审核或删除依据（至少 2 个字，将写入操作记录）",
}: AdminConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    action,
    adminActionInitialState,
  );

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={variant}
          disabled={disabled}
          className={cn(className)}
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirmTitle}</DialogTitle>
          <DialogDescription>{confirmDescription}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {requireReason ? (
            <div className="space-y-2">
              <Label htmlFor={`reason-${Object.values(hiddenFields).join("-")}`}>
                {reasonLabel}
              </Label>
              <textarea
                id={`reason-${Object.values(hiddenFields).join("-")}`}
                name="reason"
                rows={3}
                required
                maxLength={ADMIN_REVIEW_REASON_MAX}
                placeholder={reasonPlaceholder}
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          ) : null}
          <ActionMessage state={state} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" variant={variant} disabled={pending}>
              {pending ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
