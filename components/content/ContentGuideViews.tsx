import Link from "next/link";
import { Bookmark } from "lucide-react";
import { ReportDialog } from "@/components/common/ReportDialog";
import { RichContent } from "@/components/common/RichContent";
import { ContentLikeButton } from "@/components/common/ContentLikeButton";
import { EmptyState } from "@/components/common/EmptyState";
import { GuideCommentSection } from "@/components/guides/GuideCommentSection";
import { GuideFavoriteButton } from "@/components/guides/GuideFavoriteButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { OFFICIAL_CONTENT_AUTHOR_NAME } from "@/constants/site";
import { interactiveCardClassName } from "@/lib/utils/interactiveCard";
import { Highlightable } from "@/components/common/Highlightable";
import { contentHighlightId } from "@/constants/contentHighlight";
import { type ContentGuideDetail, type ContentGuideListItem } from "@/types/contentGuide";
import { type CommentReactionSummary, type CommentThreadItem } from "@/types/post";

type ContentGuideListProps = {
  items: ContentGuideListItem[];
  detailHref: (id: string) => string;
  emptyTitle: string;
  emptyDescription: string;
};

export function ContentGuideList({
  items,
  detailHref,
  emptyTitle,
  emptyDescription,
}: ContentGuideListProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Link key={item.id} href={detailHref(item.id)} className="group block h-full">
          <Card className={interactiveCardClassName("h-full")}>
            <CardHeader>
              <CardTitle className="transition-colors group-hover:text-primary">
                {item.title}
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {item.excerpt?.trim() || "点击查看详情"}
              </CardDescription>
              <p className="pt-1 text-xs text-muted-foreground">
                {OFFICIAL_CONTENT_AUTHOR_NAME}
              </p>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

type ContentGuideDetailViewProps = {
  guide: ContentGuideDetail;
  likeCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  favoriteCount: number;
  commentThread: CommentThreadItem[];
  totalCommentCount: number;
  isLoggedIn: boolean;
  canLike: boolean;
  canFavorite: boolean;
  canComment: boolean;
  currentUserId?: string;
  revalidatePath: string;
  commentReactionMap: Record<string, CommentReactionSummary>;
  reportLabel?: string;
};

export function ContentGuideDetailView({
  guide,
  likeCount,
  isLiked,
  isFavorited,
  favoriteCount,
  commentThread,
  totalCommentCount,
  isLoggedIn,
  canLike,
  canFavorite,
  canComment,
  currentUserId,
  revalidatePath,
  commentReactionMap,
  reportLabel = "举报内容",
}: ContentGuideDetailViewProps) {
  const authorName = OFFICIAL_CONTENT_AUTHOR_NAME;

  return (
    <div className="space-y-6">
      <Highlightable id={contentHighlightId("post", guide.id)} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>作者：{authorName}</span>
        <div className="flex flex-wrap items-center gap-3">
          {isFavorited ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <Bookmark className="h-4 w-4" aria-hidden="true" />
              已收藏
            </span>
          ) : null}
          <span>评论 {totalCommentCount}</span>
          <span>点赞 {likeCount}</span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RichContent content={guide.content} stripTitle={guide.title} />
        </CardContent>
      </Card>

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
          isFavorited={isFavorited}
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
          triggerLabel={reportLabel}
          triggerVariant="outline"
          triggerSize="default"
        />
      </div>
      </Highlightable>

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
