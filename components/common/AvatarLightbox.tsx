"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { DEFAULT_AVATAR_URL } from "@/constants/auth";
import { cn } from "@/lib/utils/cn";

type AvatarLightboxProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  /** 默认 56px 圆形；可传 h-14 w-14 等 */
  sizeClassName?: string;
};

/** 点击头像全屏放大查看 */
export function AvatarLightbox({
  src,
  alt = "用户头像",
  className,
  imageClassName,
  sizeClassName = "h-14 w-14",
}: AvatarLightboxProps) {
  const [open, setOpen] = useState(false);
  const avatarSrc = src?.trim() || DEFAULT_AVATAR_URL;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          sizeClassName,
          className,
        )}
        aria-label="查看头像"
      >
        <Image
          src={avatarSrc}
          alt={alt}
          fill
          className={cn("object-cover", imageClassName)}
          unoptimized
        />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="头像预览"
          onClick={close}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={close}
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc}
            alt={alt}
            className="max-h-[92vh] max-w-[96vw] rounded-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
