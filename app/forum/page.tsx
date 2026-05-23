import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ForumList } from "@/components/forum/ForumList";
import { getSessionUser } from "@/lib/auth/session";
import { listPosts } from "@/lib/db/posts";
import { ROUTES } from "@/constants/routes";
import { isForumCategoryId } from "@/constants/forumHelpers";
import { canCreateInModule } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";

type ForumPageProps = {
  searchParams: Promise<{ category?: string; page?: string }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const params = await searchParams;
  const category = params.category && isForumCategoryId(params.category)
    ? params.category
    : undefined;
  const page = Number(params.page) || 1;

  const [user, result] = await Promise.all([
    getSessionUser(),
    listPosts({ module: "forum", categoryId: category, page }),
  ]);

  const canCreate = canCreateInModule(user, "forum");

  return (
    <ModulePageShell
      title={MODULE_REGISTRY.forum.label}
      description={MODULE_REGISTRY.forum.description}
      actions={
        canCreate ? (
          <Button asChild>
            <Link href={ROUTES.forum.new}>发布帖子</Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={user ? ROUTES.profile(user.id) : ROUTES.login}>
              {user ? "认证后发帖" : "登录发帖"}
            </Link>
          </Button>
        )
      }
    >
      <ForumList
        result={result}
        activeCategory={category}
        canCreate={canCreate}
        isLoggedIn={Boolean(user)}
      />
    </ModulePageShell>
  );
}
