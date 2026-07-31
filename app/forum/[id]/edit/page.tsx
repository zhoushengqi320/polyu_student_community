import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForumPostForm } from "@/components/forum/ForumPostForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getForumPostById } from "@/lib/db/forum";
import { canManageOwnContent } from "@/lib/utils/permissions";

type ForumPostEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ForumPostEditPage({
  params,
}: ForumPostEditPageProps) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.forum.edit(id))}`);
  }

  const post = await getForumPostById(id);
  if (!post) {
    notFound();
  }

  if (!canManageOwnContent(user, post.userId)) {
    notFound();
  }

  return (
    <ModulePageShell
      title="编辑帖子"
      description="自由讨论区 · 修改帖子内容"
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.forum.detail(id)}>返回帖子</Link>
        </Button>
      }
    >
      <ForumPostForm
        mode="edit"
        postId={id}
        initialValues={{
          title: post.title,
          content: post.content,
          topics: post.topics,
          isAnonymous: post.isAnonymous,
        }}
      />
    </ModulePageShell>
  );
}
