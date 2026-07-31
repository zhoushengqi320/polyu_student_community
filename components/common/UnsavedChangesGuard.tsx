"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type UseUnsavedChangesGuardOptions = {
  /** 是否启用 beforeunload（关闭/刷新标签页） */
  enableBeforeUnload?: boolean;
};

export function useUnsavedChangesGuard(
  options: UseUnsavedChangesGuardOptions = {},
) {
  const { enableBeforeUnload = true } = options;
  const [isDirty, setIsDirty] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!enableBeforeUnload || !isDirty) return;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enableBeforeUnload, isDirty]);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  const confirmLeave = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      setPendingAction(() => action);
      setOpen(true);
    },
    [isDirty],
  );

  const stay = useCallback(() => {
    setOpen(false);
    setPendingAction(null);
  }, []);

  const leave = useCallback(() => {
    const action = pendingAction;
    setOpen(false);
    setPendingAction(null);
    setIsDirty(false);
    action?.();
  }, [pendingAction]);

  return {
    isDirty,
    setIsDirty,
    markDirty,
    markClean,
    confirmLeave,
    dialogProps: {
      open,
      onStay: stay,
      onLeave: leave,
    },
  };
}

type UnsavedChangesDialogProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
  title?: string;
  description?: string;
  stayLabel?: string;
  leaveLabel?: string;
};

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
  title = "尚未保存",
  description = "退出会丢失当前编辑进度，确定要离开吗？",
  stayLabel = "继续编辑",
  leaveLabel = "确定退出",
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onStay();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onStay}>
            {stayLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={onLeave}>
            {leaveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
