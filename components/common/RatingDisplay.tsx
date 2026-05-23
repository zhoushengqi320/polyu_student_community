import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type RatingDisplayProps = {
  value: number | null;
  max?: number;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function RatingDisplay({
  value,
  max = 5,
  showValue = true,
  size = "md",
  className,
}: RatingDisplayProps) {
  if (value === null) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        暂无评分
      </span>
    );
  }

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Star
        className={cn(iconSize, "fill-amber-400 text-amber-400")}
        aria-hidden="true"
      />
      {showValue ? (
        <span className="text-sm font-medium">{value.toFixed(1)}</span>
      ) : null}
      <span className="sr-only">
        {value} 分，满分 {max} 分
      </span>
    </div>
  );
}
