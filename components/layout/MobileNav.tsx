"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MobileNavLinks } from "@/components/layout/NavbarContent";
import { type SessionUser } from "@/types/user";

type MobileNavProps = {
  trigger: React.ReactNode;
  user: SessionUser | null;
  unreadFeedbackCount?: number;
};

export function MobileNav({
  trigger,
  user,
  unreadFeedbackCount = 0,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const panel =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100] lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="关闭菜单"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute right-0 top-0 flex h-full w-72 flex-col border-l border-border bg-card p-4 text-card-foreground shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">菜单</span>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  关闭
                </button>
              </div>
              <div
                className="min-h-0 flex-1 overflow-y-auto"
                onClick={() => setOpen(false)}
              >
                <MobileNavLinks
                  user={user}
                  unreadFeedbackCount={unreadFeedbackCount}
                />
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="lg:hidden">
      <div onClick={() => setOpen(true)}>{trigger}</div>
      {panel}
    </div>
  );
}
