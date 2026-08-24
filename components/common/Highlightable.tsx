"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { useHighlightTargetId } from "@/hooks/useContentHighlight";
import { cn } from "@/lib/utils/cn";

export function useHighlightItem(itemId: string) {
  const targetId = useHighlightTargetId();
  const ref = useRef<HTMLElement | null>(null);
  const isHighlighted = targetId === itemId;
  const isDimmed = Boolean(targetId) && !isHighlighted;

  useEffect(() => {
    if (!isHighlighted || !ref.current) {
      return;
    }
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isHighlighted]);

  return {
    ref,
    isHighlighted,
    isDimmed,
    className: cn(
      "scroll-mt-24",
      isHighlighted && "animate-message-search-highlight",
      isDimmed && "animate-message-search-dim",
    ),
  };
}

type HighlightableProps = {
  id: string;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function Highlightable({
  id,
  children,
  className,
  ...props
}: HighlightableProps) {
  const highlight = useHighlightItem(id);

  return (
    <div
      {...props}
      ref={highlight.ref as React.RefObject<HTMLDivElement>}
      id={id}
      className={cn("rounded-xl", highlight.className, className)}
    >
      {children}
    </div>
  );
}
