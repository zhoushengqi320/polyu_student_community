import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumPostCard } from "@/components/forum/ForumPostCard";
import { ForumPostDetailView } from "@/components/forum/ForumPostDetailView";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { CommentForm } from "@/components/posts/CommentForm";
import { ForumCommentList } from "@/components/forum/ForumCommentList";
import { getSessionUser } from "@/lib/auth/session";
import {
  countCommentsInThread,
  listPostCommentThread,
} from "@/lib/db/comments";
import {
  getForumPostById,
  getPostsByTopic,
  incrementForumPostViewCount,
} from "@/lib/db/forum";
import { hasReaction } from "@/lib/db/reactions";
import { ROUTES } from "@/constants/routes";
import { can, canManageOwnContent } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";

type ForumDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ForumDetailPage({ params }: ForumDetailPageProps) {
  const { id } = await params;

  await incrementForumPostViewCount(id);

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

  const [isLiked, isFavorited, relatedPosts] = await Promise.all([
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
  ]);

  const totalCommentCount = countCommentsInThread(commentThread);

  const filteredRelated = relatedPosts.filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <ModulePageShell
      title={post.title}
      description="自由讨论区 · 帖子详情"
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.forum.list}>返回讨论区</Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <ForumPostDetailView
          post={post}
          commentCount={totalCommentCount}
          isLiked={isLiked}
          isFavorited={isFavorited}
          canInteract={canInteract}
          canManage={canManageOwnContent(user, post.userId)}
          isLoggedIn={Boolean(user)}
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
            totalCount={totalCommentCount}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}
