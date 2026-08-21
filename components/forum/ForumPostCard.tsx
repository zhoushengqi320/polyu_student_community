"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const href = ROUTES.forum.detail(post.id);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className={interactiveCardClassName("h-full")}>
        <CardHeader className="space-y-3">
          <CardDescription>{formatRelativeTime(post.createdAt)}</CardDescription>
          <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
            {post.title}
          </CardTitle>
          {post.excerpt ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 无论有无话题都预留同一行高度，保证作者区位置一致 */}
          <div
            className="flex min-h-7 flex-wrap items-center gap-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            {post.topics.length > 0 ? (
              <>
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
              </>
            ) : (
              <span className="invisible text-xs">#占位</span>
            )}
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <UserIdentity
              userId={post.isAnonymous ? undefined : post.author.id}
              name={getAuthorName(post)}
              avatarUrl={post.isAnonymous ? null : post.author.avatarUrl}
              size="xs"
              nameClassName="font-normal text-muted-foreground"
              disableLink
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
    </div>
  );
}
