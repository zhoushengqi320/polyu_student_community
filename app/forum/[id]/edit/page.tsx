import { notFound } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ForumPostForm } from "@/components/forum/ForumPostForm";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getForumPostById, getForumTopics } from "@/lib/db/forum";
import { canManageOwnContent } from "@/lib/utils/permissions";
import { redirect } from "next/navigation";

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

  const [post, popularTopics] = await Promise.all([
    getForumPostById(id),
    getForumTopics(5),
  ]);
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
      back={{ href: ROUTES.forum.detail(id), label: "帖子详情" }}
    >
      <ForumPostForm
        mode="edit"
        postId={id}
        popularTopics={popularTopics}
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
