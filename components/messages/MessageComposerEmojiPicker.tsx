"use client";

import { useEffect, useRef } from "react";
import { MESSAGE_COMPOSER_EMOJIS } from "@/constants/messaging";
import { cn } from "@/lib/utils/cn";

type MessageComposerEmojiPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  ignoreRef?: React.RefObject<HTMLElement | null>;
  className?: string;
};

export function MessageComposerEmojiPicker({
  open,
  onClose,
  onSelect,
  ignoreRef,
  className,
}: MessageComposerEmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (panelRef.current?.contains(target)) {
        return;
      }
      if (ignoreRef?.current?.contains(target)) {
        return;
      }
      onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, onClose, ignoreRef]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "rounded-lg border bg-background p-2 shadow-lg",
        className,
      )}
    >
      <div className="max-h-52 overflow-y-auto">
        <div className="grid grid-cols-8 gap-0.5 sm:grid-cols-10">
        {MESSAGE_COMPOSER_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="rounded-md px-1 py-1 text-lg hover:bg-muted"
            onClick={() => onSelect(emoji)}
            aria-label={`插入表情 ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
