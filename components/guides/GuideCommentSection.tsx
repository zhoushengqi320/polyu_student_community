import { CommentForm } from "@/components/posts/CommentForm";
import { ForumCommentList } from "@/components/forum/ForumCommentList";
import { type CommentThreadItem } from "@/types/post";

type GuideCommentSectionProps = {
  guideId: string;
  commentThread: CommentThreadItem[];
  totalCommentCount: number;
  isLoggedIn: boolean;
  canComment: boolean;
  currentUserId?: string;
  isAdmin: boolean;
  revalidatePath: string;
};

export function GuideCommentSection({
  guideId,
  commentThread,
  totalCommentCount,
  isLoggedIn,
  canComment,
  currentUserId,
  isAdmin,
  revalidatePath,
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
        totalCount={totalCommentCount}
        revalidatePath={revalidatePath}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </section>
  );
}
