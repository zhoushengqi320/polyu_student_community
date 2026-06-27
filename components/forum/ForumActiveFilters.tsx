import Link from "next/link";
import { X } from "lucide-react";
import { buildForumUrl, getForumCategoryLabel, type ForumSortId } from "@/constants/forum";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/common/TagBadge";

type ForumActiveFiltersProps = {
  q?: string;
  topic?: string;
  category?: string;
  sort: ForumSortId;
};

export function ForumActiveFilters({
  q,
  topic,
  category,
  sort,
}: ForumActiveFiltersProps) {
  const hasFilters = Boolean(q || topic || category);

  if (!hasFilters) {
    return null;
  }

  const categoryLabel = category ? getForumCategoryLabel(category) : null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-sm text-muted-foreground">当前筛选：</span>
      {q ? <TagBadge label={`搜索「${q}」`} /> : null}
      {topic ? <TagBadge label={`话题 #${topic}`} /> : null}
      {categoryLabel ? <TagBadge label={categoryLabel} /> : null}
      <Button variant="ghost" size="sm" className="ml-auto h-8 gap-1" asChild>
        <Link href={buildForumUrl({ sort })}>
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          清除筛选
        </Link>
      </Button>
    </div>
  );
}
