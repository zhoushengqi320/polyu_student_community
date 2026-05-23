import Link from "next/link";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { getForumCategoryLabel } from "@/constants/forumHelpers";
import { ROUTES } from "@/constants/routes";
import { TagBadge } from "@/components/common/TagBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type PostDetail } from "@/types/post";

type PostDetailViewProps = {
  post: PostDetail;
};

function getAuthorName(post: PostDetail): string {
  return post.author.displayName ?? post.author.username;
}

export function PostDetailView({ post }: PostDetailViewProps) {
  const categoryLabel = getForumCategoryLabel(post.categoryId);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {categoryLabel ? <TagBadge label={categoryLabel} /> : null}
          <span className="text-sm text-muted-foreground">
            {formatDateTime(post.createdAt)}
          </span>
        </div>
        <CardTitle className="text-2xl">{post.title}</CardTitle>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link
            href={ROUTES.profile(post.author.id)}
            className="font-medium text-foreground hover:text-primary"
          >
            {getAuthorName(post)}
          </Link>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            {post.likeCount} 赞
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {post.commentCount} 评论
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-sm leading-7">{post.content}</div>
      </CardContent>
    </Card>
  );
}
