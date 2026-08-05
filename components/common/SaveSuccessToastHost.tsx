"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { subscribeSaveSuccessToast } from "@/lib/utils/saveSuccessToast";
import { cn } from "@/lib/utils/cn";

const DISPLAY_MS = 1800;

/**
 * 全局挂载：屏幕中央短暂提示「保存成功」。
 * 使用 portal，离开编辑页后仍能显示完整动画。
 */
export function SaveSuccessToastHost() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("保存成功");
  const [token, setToken] = useState(0);

  useEffect(() => {
    setMounted(true);
    return subscribeSaveSuccessToast((nextMessage) => {
      setMessage(nextMessage);
      setToken((value) => value + 1);
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setTimeout(() => setVisible(false), DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [visible, token]);

  if (!mounted || !visible) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        key={token}
        className={cn(
          "rounded-lg bg-zinc-900/92 px-5 py-2.5 text-sm font-medium text-white shadow-lg",
          "animate-[save-toast-in_180ms_ease-out]",
        )}
      >
        {message}
      </div>
    </div>,
    document.body,
  );
}
