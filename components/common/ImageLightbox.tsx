"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ImageLightboxProps = {
  children: React.ReactNode;
  className?: string;
};

/** 点击正文内图片全屏放大查看 */
export function ImageLightbox({ children, className }: ImageLightboxProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  const close = useCallback(() => {
    setSrc(null);
    setAlt("");
  }, []);

  useEffect(() => {
    if (!src) {
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
  }, [src, close]);

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) {
      return;
    }
    if (!target.src) {
      return;
    }
    // 忽略极小装饰图
    if (target.naturalWidth > 0 && target.naturalWidth < 48) {
      return;
    }
    event.preventDefault();
    setSrc(target.currentSrc || target.src);
    setAlt(target.alt || "图片预览");
  }

  return (
    <>
      <div
        className={cn("rich-content-images", className)}
        onClick={handleClick}
        role="presentation"
      >
        {children}
      </div>

      {src ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="图片放大预览"
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
            src={src}
            alt={alt}
            className="max-h-[92vh] max-w-[96vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
