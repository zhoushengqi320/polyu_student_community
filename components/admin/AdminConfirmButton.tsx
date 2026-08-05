"use client";

import { useActionState, useState } from "react";
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
import {
  adminActionInitialState,
  type AdminActionState,
} from "@/lib/admin/state";
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
}: AdminConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    action,
    adminActionInitialState,
  );

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
        <form
          action={formAction}
          className="space-y-4"
          onSubmit={() => {
            setTimeout(() => setOpen(false), 300);
          }}
        >
          {Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <ActionMessage state={state} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
