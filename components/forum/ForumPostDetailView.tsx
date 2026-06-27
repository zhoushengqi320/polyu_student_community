import Link from "next/link";
import { Eye, Flame, MessageSquare } from "lucide-react";
import { ForumReactionButtons } from "@/components/forum/ForumReactionButtons";
import { ReportDialog } from "@/components/common/ReportDialog";
import { TopicBadge } from "@/components/forum/TopicBadge";
import { TagBadge } from "@/components/common/TagBadge";
import { buildForumUrl, getForumCategoryLabel } from "@/constants/forum";
import { FORUM_REPORT_TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type ForumPostDetail } from "@/types/forum";

type ForumPostDetailViewProps = {
  post: ForumPostDetail;
  commentCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  canInteract: boolean;
  isLoggedIn: boolean;
};

function getAuthorName(post: ForumPostDetail): string {
  if (post.isAnonymous) {
    return "匿名用户";
  }
  return post.author.displayName ?? post.author.username;
}

export function ForumPostDetailView({
  post,
  commentCount,
  isLiked,
  isFavorited,
  canInteract,
  isLoggedIn,
}: ForumPostDetailViewProps) {
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

        {post.topics.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {post.topics.map((topic) => (
              <TopicBadge
                key={topic}
                topic={topic}
                href={buildForumUrl({ topic })}
              />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.isAnonymous ? (
            <span className="font-medium text-foreground">{getAuthorName(post)}</span>
          ) : (
            <Link
              href={ROUTES.profile(post.author.id)}
              className="font-medium text-foreground hover:text-primary"
            >
              {getAuthorName(post)}
            </Link>
          )}
          <span className="inline-flex items-center gap-1">
            <Flame className="h-4 w-4" aria-hidden="true" />
            热度 {post.hotScore}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" aria-hidden="true" />
            {post.viewCount} 浏览
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {commentCount} 评论
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ForumReactionButtons
            postId={post.id}
            likeCount={post.likeCount}
            isLiked={isLiked}
            isFavorited={isFavorited}
            canInteract={canInteract}
            revalidatePath={ROUTES.forum.detail(post.id)}
          />
          <ReportDialog
            targetType={FORUM_REPORT_TARGET_TYPES.post}
            targetId={post.id}
            isLoggedIn={isLoggedIn}
            revalidatePath={ROUTES.forum.detail(post.id)}
            triggerLabel="举报帖子"
            triggerVariant="outline"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-sm leading-7">{post.content}</div>
      </CardContent>
    </Card>
  );
}
