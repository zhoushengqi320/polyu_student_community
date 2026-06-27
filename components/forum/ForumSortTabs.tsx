import Link from "next/link";
import {
  FORUM_SORT_OPTIONS,
  buildForumUrl,
  type ForumSortId,
} from "@/constants/forum";
import { cn } from "@/lib/utils/cn";

type ForumSortTabsProps = {
  activeSort: ForumSortId;
  q?: string;
  topic?: string;
  category?: string;
};

export function ForumSortTabs({
  activeSort,
  q,
  topic,
  category,
}: ForumSortTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FORUM_SORT_OPTIONS.map((option) => (
        <Link
          key={option.id}
          href={buildForumUrl({ q, topic, category, sort: option.id })}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            activeSort === option.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
