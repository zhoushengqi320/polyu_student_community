import { notFound } from "next/navigation";
import { ForumPostCard } from "@/components/forum/ForumPostCard";
import { ForumPostDetailView } from "@/components/forum/ForumPostDetailView";
import { ForumPostViewTracker } from "@/components/forum/ForumPostViewTracker";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { CommentForm } from "@/components/posts/CommentForm";
import { ForumCommentList } from "@/components/forum/ForumCommentList";
import { getSessionUser } from "@/lib/auth/session";
import {
  countCommentsInThread,
  collectCommentIdsFromThread,
  listPostCommentThread,
} from "@/lib/db/comments";
import {
  getForumPostById,
  getPostsByTopic,
} from "@/lib/db/forum";
import { getReactionSummariesForTargets, hasReaction } from "@/lib/db/reactions";
import { ROUTES } from "@/constants/routes";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { can, canManageOwnContent, isAdmin } from "@/lib/utils/permissions";
import { getVisitorId } from "@/lib/guest/visitorId";

type ForumDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ForumDetailPage({ params }: ForumDetailPageProps) {
  const { id } = await params;

  const [post, commentThread, user] = await Promise.all([
    getForumPostById(id),
    listPostCommentThread(id),
    getSessionUser(),
  ]);

  if (!post) {
    notFound();
  }

  const canComment = can(user, "interaction:comment");
  const canInteract = can(user, "interaction:like");
  const canLikeComments = canInteract;

  const [isLiked, isFavorited, relatedPosts, visitorId] = await Promise.all([
    user
      ? hasReaction({
          userId: user.id,
          targetType: "post",
          targetId: post.id,
          type: "like",
        })
      : Promise.resolve(false),
    user
      ? hasReaction({
          userId: user.id,
          targetType: "post",
          targetId: post.id,
          type: "favorite",
        })
      : Promise.resolve(false),
    post.topics[0]
      ? getPostsByTopic(post.topics[0], 4)
      : Promise.resolve([]),
    user ? Promise.resolve(null) : getVisitorId(),
  ]);

  const totalCommentCount = countCommentsInThread(commentThread);
  const commentIds = collectCommentIdsFromThread(commentThread);
  const commentReactionMap = await getReactionSummariesForTargets({
    targetType: TARGET_TYPES.comment,
    targetIds: commentIds,
    userId: user?.id,
    visitorId: visitorId ?? undefined,
    type: "like",
  });
  const reactionMap = Object.fromEntries(commentReactionMap.entries());

  const filteredRelated = relatedPosts.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <ModulePageShell
      title={post.title}
      description="自由讨论区 · 帖子详情"
      back={{ href: ROUTES.forum.list, label: "自由讨论区" }}
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <ForumPostViewTracker postId={post.id} />
        <ForumPostDetailView
          post={post}
          commentCount={totalCommentCount}
          isLiked={isLiked}
          isFavorited={isFavorited}
          canInteract={canInteract}
          canManage={canManageOwnContent(user, post.userId)}
          isLoggedIn={Boolean(user)}
          currentUserId={user?.id ?? null}
        />

        {filteredRelated.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">相关帖子</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {filteredRelated.map((item) => (
                <ForumPostCard key={item.id} post={item} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">评论 ({totalCommentCount})</h2>
          <CommentForm
            postId={post.id}
            canComment={canComment}
            isLoggedIn={Boolean(user)}
          />
          <ForumCommentList
            comments={commentThread}
            postId={post.id}
            isLoggedIn={Boolean(user)}
            canComment={canComment}
            canLike={canLikeComments}
            totalCount={totalCommentCount}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin(user)}
            reactionMap={reactionMap}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}
