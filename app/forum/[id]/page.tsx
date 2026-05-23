import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { CommentForm } from "@/components/posts/CommentForm";
import { CommentList } from "@/components/posts/CommentList";
import { PostDetailView } from "@/components/posts/PostDetail";
import { getSessionUser } from "@/lib/auth/session";
import { listPostComments } from "@/lib/db/comments";
import { getPostById } from "@/lib/db/posts";
import { ROUTES } from "@/constants/routes";
import { can } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";

type ForumDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ForumDetailPage({ params }: ForumDetailPageProps) {
  const { id } = await params;

  const [post, comments, user] = await Promise.all([
    getPostById(id, "forum"),
    listPostComments(id),
    getSessionUser(),
  ]);

  if (!post) {
    notFound();
  }

  const canComment = can(user, "interaction:comment");

  return (
    <ModulePageShell
      title={post.title}
      description={`${MODULE_REGISTRY.forum.label} · 帖子详情`}
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.forum.list}>返回讨论区</Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <PostDetailView post={post} />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">评论 ({comments.length})</h2>
          <CommentForm
            postId={post.id}
            canComment={canComment}
            isLoggedIn={Boolean(user)}
          />
          <CommentList comments={comments} />
        </section>
      </div>
    </ModulePageShell>
  );
}
