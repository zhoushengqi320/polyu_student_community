import Link from "next/link";
import { Eye, MessageSquare, ThumbsUp } from "lucide-react";
import { UserIdentity } from "@/components/common/UserIdentity";
import { TopicBadge } from "@/components/forum/TopicBadge";
import { buildForumUrl } from "@/constants/forum";
import { ROUTES } from "@/constants/routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { interactiveCardClassName } from "@/lib/utils/interactiveCard";
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
  return (
    <Card className={interactiveCardClassName("h-full")}>
      <CardHeader className="space-y-3">
        <CardDescription>{formatRelativeTime(post.createdAt)}</CardDescription>
        <Link
          href={ROUTES.forum.detail(post.id)}
          prefetch={false}
          className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
            {post.title}
          </CardTitle>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}
        </Link>
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
          <UserIdentity
            userId={post.isAnonymous ? undefined : post.author.id}
            name={getAuthorName(post)}
            avatarUrl={post.isAnonymous ? null : post.author.avatarUrl}
            size="xs"
            nameClassName="font-normal text-muted-foreground"
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              {post.likeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {post.commentCount}
            </span>
            <span className="inline-flex items-center gap-1" title="进入详情页后累计">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {post.viewCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
