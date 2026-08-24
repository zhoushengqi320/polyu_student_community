import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type MessageQuotePreviewBarProps = {
  senderName: string;
  previewText: string;
  onDismiss?: () => void;
  onClick?: () => void;
  compact?: boolean;
  tone?: "default" | "inverted";
  className?: string;
};

export function MessageQuotePreviewBar({
  senderName,
  previewText,
  onDismiss,
  onClick,
  compact = false,
  tone = "default",
  className,
}: MessageQuotePreviewBarProps) {
  const inverted = tone === "inverted";
  const clickable = Boolean(onClick);

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "relative flex items-stretch gap-2 rounded-md",
        inverted ? "bg-black/10" : "bg-muted/70",
        compact ? "px-2 py-1.5" : "px-3 py-2",
        clickable && "cursor-pointer hover:opacity-90",
        className,
      )}
    >
      <div
        className={cn(
          "w-0.5 shrink-0 rounded-full",
          inverted ? "bg-primary-foreground/80" : "bg-primary/70",
          compact ? "my-0.5" : "my-1",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pr-6">
        <p
          className={cn(
            "truncate font-medium",
            inverted ? "text-primary-foreground" : "text-primary",
            compact ? "text-[11px]" : "text-xs",
          )}
        >
          {senderName}
        </p>
        <p
          className={cn(
            "line-clamp-2 whitespace-pre-wrap break-words",
            inverted ? "text-primary-foreground/75" : "text-muted-foreground",
            compact ? "text-[11px] leading-4" : "text-xs leading-5",
          )}
        >
          {previewText}
        </p>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
          aria-label="取消引用"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
