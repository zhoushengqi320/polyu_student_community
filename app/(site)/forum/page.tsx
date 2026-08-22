import Link from "next/link";
import { Suspense } from "react";
import { FORUM_DESCRIPTION, FORUM_POPULAR_TOPICS_LIMIT, normalizeForumSort } from "@/constants/forum";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ForumList } from "@/components/forum/ForumList";
import { getSessionUser } from "@/lib/auth/session";
import { getForumPosts, getForumTopics } from "@/lib/db/forum";
import { ROUTES } from "@/constants/routes";
import { getModuleCreatePrompt } from "@/lib/utils/authPrompts";
import { Button } from "@/components/ui/button";

type ForumPageProps = {
  searchParams: Promise<{
    q?: string;
    topic?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || undefined;
  const topic = params.topic?.trim() || undefined;
  const sort = normalizeForumSort(params.sort);
  const page = Number(params.page) || 1;

  const [user, result, popularTopics] = await Promise.all([
    getSessionUser(),
    getForumPosts({ query, topic, sort, page }),
    getForumTopics(FORUM_POPULAR_TOPICS_LIMIT),
  ]);

  const createPrompt = getModuleCreatePrompt(
    user,
    "forum",
    {
      login: "登录发帖",
      banned: "账号受限",
      unverified: "认证后发帖",
    },
    ROUTES.forum.new,
  );

  const canCreate = !createPrompt;

  return (
    <ModulePageShell
      title="自由讨论区"
      description={FORUM_DESCRIPTION}
      back={{ href: ROUTES.home, label: "首页" }}
      actions={
        createPrompt ? (
          <Button variant="outline" asChild>
            <Link href={createPrompt.href}>{createPrompt.label}</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={ROUTES.forum.new}>发布帖子</Link>
          </Button>
        )
      }
    >
      <Suspense>
        <ForumList
          result={result}
          popularTopics={popularTopics}
          activeQuery={query}
          activeTopic={topic}
          activeSort={sort}
          canCreate={canCreate}
          isLoggedIn={Boolean(user)}
        />
      </Suspense>
    </ModulePageShell>
  );
}
