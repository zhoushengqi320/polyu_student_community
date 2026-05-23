import Link from "next/link";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { getForumCategoryLabel } from "@/constants/forumHelpers";
import { ROUTES } from "@/constants/routes";
import { TagBadge } from "@/components/common/TagBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type PostListItem } from "@/types/post";

type PostCardProps = {
  post: PostListItem;
};

function getAuthorName(post: PostListItem): string {
  return post.author.displayName ?? post.author.username;
}

export function PostCard({ post }: PostCardProps) {
  const categoryLabel = getForumCategoryLabel(post.categoryId);

  return (
    <Link href={ROUTES.forum.detail(post.id)} className="block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabel ? <TagBadge label={categoryLabel} /> : null}
            <CardDescription>{formatRelativeTime(post.createdAt)}</CardDescription>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{getAuthorName(post)}</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              {post.likeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {post.commentCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
