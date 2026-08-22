import { TagBadge } from "@/components/common/TagBadge";
import { cn } from "@/lib/utils/cn";

type AdminRoleBadgeProps = {
  className?: string;
};

export function AdminRoleBadge({ className }: AdminRoleBadgeProps) {
  return (
    <TagBadge
      label="管理员"
      className={cn(
        "shrink-0 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold text-primary",
        className,
      )}
    />
  );
}
