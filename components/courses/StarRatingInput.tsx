"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Label } from "@/components/ui/label";

type StarRatingInputProps = {
  id: string;
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  optionLabels?: readonly string[];
  error?: string;
  required?: boolean;
  className?: string;
};

export function StarRatingInput({
  id,
  name,
  label,
  value,
  onChange,
  optionLabels,
  error,
  required = true,
  className,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const draggingRef = useRef(false);
  const displayValue = hoverValue || value;
  const hint =
    displayValue > 0 && optionLabels?.[displayValue - 1]
      ? optionLabels[displayValue - 1]
      : required
        ? "滑动或点击星星评分"
        : "可选 · 滑动或点击星星";

  function scoreFromClientX(clientX: number, element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.min(5, Math.max(1, Math.ceil(ratio * 5)));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    const next = scoreFromClientX(event.clientX, event.currentTarget);
    setHoverValue(next);
    onChange(next);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const next = scoreFromClientX(event.clientX, event.currentTarget);
    setHoverValue(next);
    if (draggingRef.current) {
      onChange(next);
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setHoverValue(0);
  }

  function handlePointerLeave() {
    if (!draggingRef.current) {
      setHoverValue(0);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {displayValue > 0 ? `${displayValue} 分 · ${hint}` : hint}
        </span>
      </div>
      <input type="hidden" name={name} value={value > 0 ? String(value) : ""} />
      <div
        role="slider"
        tabIndex={0}
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={value || undefined}
        aria-valuetext={value > 0 ? `${value} 分` : "未评分"}
        aria-label={label}
        aria-invalid={Boolean(error)}
        className={cn(
          "inline-flex touch-none select-none gap-1 rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "ring-2 ring-destructive",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            onChange(Math.min(5, (value || 0) + 1));
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            onChange(Math.max(required ? 1 : 0, (value || 1) - 1));
          }
        }}
      >
        {[1, 2, 3, 4, 5].map((score) => {
          const active = displayValue >= score;
          return (
            <Star
              key={score}
              className={cn(
                "h-8 w-8 transition-colors",
                active
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40",
              )}
              aria-hidden="true"
            />
          );
        })}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
