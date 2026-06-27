import Link from "next/link";
import { Eye, Flame, MessageSquare, ThumbsUp } from "lucide-react";
import { TopicBadge } from "@/components/forum/TopicBadge";
import { TagBadge } from "@/components/common/TagBadge";
import { buildForumUrl, getForumCategoryLabel } from "@/constants/forum";
import { ROUTES } from "@/constants/routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type ForumPostListItem } from "@/types/forum";

type ForumPostCardProps = {
  post: ForumPostListItem;
};

function getAuthorName(post: ForumPostListItem): string {
  if (post.isAnonymous) {
    return "匿名用户";
  }
  return post.author.displayName ?? post.author.username;
}

export function ForumPostCard({ post }: ForumPostCardProps) {
  const categoryLabel = getForumCategoryLabel(post.categoryId);

  return (
    <Link href={ROUTES.forum.detail(post.id)} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabel ? <TagBadge label={categoryLabel} /> : null}
            <CardDescription>{formatRelativeTime(post.createdAt)}</CardDescription>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
          {post.excerpt ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {post.topics.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {post.topics.slice(0, 3).map((topic) => (
                <TopicBadge
                  key={topic}
                  topic={topic}
                  href={buildForumUrl({ topic })}
                />
              ))}
              {post.topics.length > 3 ? (
                <span className="text-xs text-muted-foreground">
                  +{post.topics.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>{getAuthorName(post)}</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1" title="热度">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                {post.hotScore}
              </span>
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                {post.likeCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                {post.commentCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                {post.viewCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
