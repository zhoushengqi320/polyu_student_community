import { AlertCircle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type HomeEmptyStateProps = {
  title: string;
  description?: string;
  error?: boolean;
  className?: string;
};

export function HomeEmptyState({
  title,
  description,
  error = false,
  className,
}: HomeEmptyStateProps) {
  const Icon = error ? AlertCircle : Inbox;

  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-8 text-center",
        error ? "border-destructive/30 bg-destructive/5" : undefined,
        className,
      )}
    >
      <Icon
        className={cn(
          "h-8 w-8",
          error ? "text-destructive" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
