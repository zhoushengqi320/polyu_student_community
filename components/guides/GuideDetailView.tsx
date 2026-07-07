import { Bookmark, CalendarCheck, Clock, UserRound } from "lucide-react";
import { MarkdownContent } from "@/components/guides/MarkdownContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGuideCategoryLabel } from "@/constants/guides";
import { formatDate } from "@/lib/utils/formatDate";
import { type GuideDetail } from "@/types/guide";

type GuideDetailViewProps = {
  guide: GuideDetail;
};

export function GuideDetailView({ guide }: GuideDetailViewProps) {
  const categoryLabel = getGuideCategoryLabel(
    guide.meta?.category ?? guide.categoryId,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
              {categoryLabel}
            </span>
            {guide.meta?.estimatedReadingTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {guide.meta.estimatedReadingTime} 分钟阅读
              </span>
            ) : null}
            {guide.isFavorited ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                已收藏
              </span>
            ) : null}
          </div>
          <div>
            <CardTitle className="text-2xl">{guide.title}</CardTitle>
            <CardDescription className="mt-2">
              {guide.author.displayName ?? guide.author.username}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          {guide.meta?.targetAudience ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              {guide.meta.targetAudience}
            </span>
          ) : null}
          {guide.meta?.lastVerifiedAt ? (
            <span className="inline-flex items-center gap-1">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              更新核对：{formatDate(guide.meta.lastVerifiedAt)}
            </span>
          ) : null}
          <span>评论数：{guide.commentCount}</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <MarkdownContent content={guide.content} />
        </CardContent>
      </Card>

      {guide.meta?.sourceLinks.length ? (
        <Card>
          <CardHeader>
            <CardTitle>参考链接</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {guide.meta.sourceLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                {link.label}
              </a>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
