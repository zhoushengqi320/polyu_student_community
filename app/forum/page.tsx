import Link from "next/link";
import { Suspense } from "react";
import { FORUM_DESCRIPTION } from "@/constants/forum";
import {
  isForumCategoryId,
  isForumSortId,
} from "@/constants/forumHelpers";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ForumList } from "@/components/forum/ForumList";
import { getSessionUser } from "@/lib/auth/session";
import {
  getForumPosts,
  getForumTopics,
  getHotForumPosts,
} from "@/lib/db/forum";
import { ROUTES } from "@/constants/routes";
import { canCreateInModule } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";

type ForumPageProps = {
  searchParams: Promise<{
    q?: string;
    topic?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || undefined;
  const topic = params.topic?.trim() || undefined;
  const category =
    params.category && isForumCategoryId(params.category)
      ? params.category
      : undefined;
  const sort = params.sort && isForumSortId(params.sort) ? params.sort : "latest";
  const page = Number(params.page) || 1;

  const [user, result, hotPosts, popularTopics] = await Promise.all([
    getSessionUser(),
    getForumPosts({ query, topic, category, sort, page }),
    getHotForumPosts(5),
    getForumTopics(12),
  ]);

  const canCreate = canCreateInModule(user, "forum");

  return (
    <ModulePageShell
      title="自由讨论区"
      description={FORUM_DESCRIPTION}
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
      <Suspense>
        <ForumList
          result={result}
          hotPosts={hotPosts}
          popularTopics={popularTopics}
          activeQuery={query}
          activeTopic={topic}
          activeCategory={category}
          activeSort={sort}
          canCreate={canCreate}
          isLoggedIn={Boolean(user)}
        />
      </Suspense>
    </ModulePageShell>
  );
}
