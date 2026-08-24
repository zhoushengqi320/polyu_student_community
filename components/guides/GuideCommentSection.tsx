import { CommentForm } from "@/components/posts/CommentForm";
import { ForumCommentList } from "@/components/forum/ForumCommentList";
import { type CommentReactionSummary, type CommentThreadItem } from "@/types/post";

type GuideCommentSectionProps = {
  guideId: string;
  commentThread: CommentThreadItem[];
  totalCommentCount: number;
  isLoggedIn: boolean;
  canComment: boolean;
  canLike: boolean;
  currentUserId?: string;
  revalidatePath: string;
  reactionMap: Record<string, CommentReactionSummary>;
};

export function GuideCommentSection({
  guideId,
  commentThread,
  totalCommentCount,
  isLoggedIn,
  canComment,
  canLike,
  currentUserId,
  revalidatePath,
  reactionMap,
}: GuideCommentSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">评论 ({totalCommentCount})</h2>
      <CommentForm
        postId={guideId}
        canComment={canComment}
        isLoggedIn={isLoggedIn}
        revalidatePath={revalidatePath}
      />
      <ForumCommentList
        comments={commentThread}
        postId={guideId}
        isLoggedIn={isLoggedIn}
        canComment={canComment}
        canLike={canLike}
        totalCount={totalCommentCount}
        revalidatePath={revalidatePath}
        currentUserId={currentUserId}
        reactionMap={reactionMap}
      />
    </section>
  );
}
