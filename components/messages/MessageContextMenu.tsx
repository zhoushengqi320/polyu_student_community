"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

export type MessageContextMenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  onSelect: () => void;
};

type MessageContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  items: MessageContextMenuItem[];
  onClose: () => void;
};

const MENU_WIDTH = 168;

export function MessageContextMenu({
  open,
  x,
  y,
  items,
  onClose,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (menuRef.current?.contains(target)) {
        return;
      }
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const menuHeight = items.length * 40 + 8;
  const clampedX = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 8);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[200] min-w-[168px] rounded-md border bg-background p-1 text-foreground shadow-lg"
      style={{ left: clampedX, top: clampedY }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-muted",
              item.disabled && "cursor-not-allowed opacity-50",
            )}
            onClick={() => {
              if (item.disabled) {
                return;
              }
              item.onSelect();
              onClose();
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
