import Link from "next/link";
import { Eye, MessageSquare } from "lucide-react";
import { UserIdentity } from "@/components/common/UserIdentity";
import { ForumReactionButtons } from "@/components/forum/ForumReactionButtons";
import { DeleteContentButton } from "@/components/common/DeleteContentButton";
import { ReportDialog } from "@/components/common/ReportDialog";
import { TopicBadge } from "@/components/forum/TopicBadge";
import { buildForumUrl } from "@/constants/forum";
import { FORUM_REPORT_TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteForumPostAction } from "@/lib/forum/actions";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type ForumPostDetail } from "@/types/forum";

type ForumPostDetailViewProps = {
  post: ForumPostDetail;
  commentCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  canInteract: boolean;
  canManage: boolean;
  isLoggedIn: boolean;
  currentUserId?: string | null;
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
  canManage,
  isLoggedIn,
  currentUserId,
}: ForumPostDetailViewProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <span className="text-sm text-muted-foreground">
          {formatDateTime(post.createdAt)}
        </span>
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
          <UserIdentity
            userId={post.isAnonymous ? undefined : post.author.id}
            name={getAuthorName(post)}
            avatarUrl={post.isAnonymous ? null : post.author.avatarUrl}
            role={post.isAnonymous ? null : post.author.role}
            size="sm"
          />
          <span className="inline-flex items-center gap-1" title="进入详情页后累计">
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
            isLoggedIn={isLoggedIn}
            revalidatePath={ROUTES.forum.detail(post.id)}
          />
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href={ROUTES.forum.edit(post.id)}>编辑</Link>
                </Button>
                <DeleteContentButton
                  action={deleteForumPostAction.bind(null, post.id)}
                  label="删除"
                  title="确认删除帖子？"
                  description="帖子删除后将不再公开显示，此操作无法在前台撤销。"
                />
              </>
            ) : null}
            <ReportDialog
              targetType={FORUM_REPORT_TARGET_TYPES.post}
              targetId={post.id}
              isLoggedIn={isLoggedIn}
              ownerId={post.userId}
              currentUserId={currentUserId}
              revalidatePath={ROUTES.forum.detail(post.id)}
              triggerLabel="举报帖子"
              triggerVariant="outline"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-sm leading-7">{post.content}</div>
      </CardContent>
    </Card>
  );
}
