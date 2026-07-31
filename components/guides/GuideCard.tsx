import Link from "next/link";
import { Bookmark, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGuideCategoryLabel } from "@/constants/guides";
import { ROUTES } from "@/constants/routes";
import { interactiveCardClassName } from "@/lib/utils/interactiveCard";
import { type GuideListItem } from "@/types/guide";

type GuideCardProps = {
  guide: GuideListItem;
};

export function GuideCard({ guide }: GuideCardProps) {
  const categoryLabel = getGuideCategoryLabel(
    guide.meta?.category ?? guide.categoryId,
  );

  return (
    <Link href={ROUTES.guides.detail(guide.id)} className="group block h-full">
      <Card className={interactiveCardClassName("h-full")}>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
              {categoryLabel}
            </span>
            {guide.isFavorited ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                已收藏
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
              {guide.title}
            </CardTitle>
            {guide.excerpt ? (
              <CardDescription className="line-clamp-3">
                {guide.excerpt}
              </CardDescription>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{guide.author.displayName ?? guide.author.username}</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {guide.commentCount} 条评论
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
