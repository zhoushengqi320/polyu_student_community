"use client";

import { useState } from "react";
import { MobileNavLinks } from "@/components/layout/NavbarContent";
import { type SessionUser } from "@/types/user";

type MobileNavProps = {
  trigger: React.ReactNode;
  user: SessionUser | null;
};

export function MobileNav({ trigger, user }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-72 border-l bg-background p-4 shadow-xl">
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
            <div onClick={() => setOpen(false)}>
              <MobileNavLinks user={user} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
