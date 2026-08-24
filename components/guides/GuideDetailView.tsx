import { Bookmark, CalendarCheck } from "lucide-react";
import { ReportDialog } from "@/components/common/ReportDialog";
import { ContentLikeButton } from "@/components/common/ContentLikeButton";
import { GuideCommentSection } from "@/components/guides/GuideCommentSection";
import { GuideFavoriteButton } from "@/components/guides/GuideFavoriteButton";
import { RichContent } from "@/components/common/RichContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { OFFICIAL_CONTENT_AUTHOR_NAME } from "@/constants/site";
import { formatDate } from "@/lib/utils/formatDate";
import { isSafeHref } from "@/lib/utils/safeUrl";
import { type GuideDetail } from "@/types/guide";
import { type CommentReactionSummary, type CommentThreadItem } from "@/types/post";

type GuideDetailViewProps = {
  guide: GuideDetail;
  likeCount: number;
  isLiked: boolean;
  favoriteCount: number;
  commentThread: CommentThreadItem[];
  totalCommentCount: number;
  isLoggedIn: boolean;
  canComment: boolean;
  canFavorite: boolean;
  canLike: boolean;
  currentUserId?: string;
  revalidatePath: string;
  commentReactionMap: Record<string, CommentReactionSummary>;
};

export function GuideDetailView({
  guide,
  likeCount,
  isLiked,
  favoriteCount,
  commentThread,
  totalCommentCount,
  isLoggedIn,
  canComment,
  canFavorite,
  canLike,
  currentUserId,
  revalidatePath,
  commentReactionMap,
}: GuideDetailViewProps) {
  const authorName = OFFICIAL_CONTENT_AUTHOR_NAME;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          {guide.isFavorited ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-primary">
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                已收藏
              </span>
            </div>
          ) : null}
          <div>
            <CardDescription>{authorName}</CardDescription>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            {guide.meta?.lastVerifiedAt ? (
              <span className="inline-flex items-center gap-1">
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                更新核对：{formatDate(guide.meta.lastVerifiedAt)}
              </span>
            ) : null}
            <span>评论数：{totalCommentCount}</span>
            <span>点赞：{likeCount}</span>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <RichContent content={guide.content} stripTitle={guide.title} />
        </CardContent>
      </Card>

      {guide.meta?.sourceLinks.length ? (
        <Card>
          <CardHeader>
            <CardTitle>参考链接</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {guide.meta.sourceLinks.map((link) =>
              isSafeHref(link.url) ? (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block text-sm text-primary hover:underline"
                >
                  {link.label}
                </a>
              ) : (
                <span key={link.url} className="block text-sm text-muted-foreground">
                  {link.label}
                </span>
              ),
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-start gap-3 rounded-xl border bg-card px-4 py-3">
        <ContentLikeButton
          postId={guide.id}
          likeCount={likeCount}
          isLiked={isLiked}
          isLoggedIn={isLoggedIn}
          canLike={canLike}
          revalidatePath={revalidatePath}
        />
        <GuideFavoriteButton
          guideId={guide.id}
          isFavorited={guide.isFavorited}
          favoriteCount={favoriteCount}
          isLoggedIn={isLoggedIn}
          canFavorite={canFavorite}
          revalidatePath={revalidatePath}
        />
        <ReportDialog
          targetType={TARGET_TYPES.post}
          targetId={guide.id}
          isLoggedIn={isLoggedIn}
          ownerId={guide.userId}
          currentUserId={currentUserId}
          revalidatePath={revalidatePath}
          triggerLabel="举报攻略"
          triggerVariant="outline"
          triggerSize="default"
        />
      </div>

      <GuideCommentSection
        guideId={guide.id}
        commentThread={commentThread}
        totalCommentCount={totalCommentCount}
        isLoggedIn={isLoggedIn}
        canComment={canComment}
        canLike={canLike}
        currentUserId={currentUserId}
        revalidatePath={revalidatePath}
        reactionMap={commentReactionMap}
      />
    </div>
  );
}
