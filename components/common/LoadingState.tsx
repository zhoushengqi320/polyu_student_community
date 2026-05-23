import { cn } from "@/lib/utils/cn";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "加载中...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
