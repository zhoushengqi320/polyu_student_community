"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type PendingOverlayProps = {
  active: boolean;
  label?: string;
  className?: string;
};

/** 操作进行中：全屏遮罩 + 转圈，禁止点击/滚动 */
export function PendingOverlay({
  active,
  label = "加载中…",
  className,
}: PendingOverlayProps) {
  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[1px]",
        className,
      )}
      role="alertdialog"
      aria-busy="true"
      aria-live="assertive"
      aria-label={label}
      onWheel={(event) => event.preventDefault()}
      onTouchMove={(event) => event.preventDefault()}
    >
      <div className="flex items-center gap-3 rounded-xl bg-background px-5 py-4 shadow-lg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
