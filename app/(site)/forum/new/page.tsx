import { redirect } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ForumPostForm } from "@/components/forum/ForumPostForm";
import { getSessionUser } from "@/lib/auth/session";
import { getForumTopics } from "@/lib/db/forum";
import { ROUTES } from "@/constants/routes";
import { canCreateInModule } from "@/lib/utils/permissions";

export default async function NewForumPostPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.forum.new)}`);
  }

  if (!canCreateInModule(user, "forum")) {
    return (
      <ModulePageShell
        title="发布帖子"
        description="自由讨论区 · 需要理大认证"
        back={{ href: ROUTES.forum.list, label: "自由讨论区" }}
      >
        <div className="mx-auto max-w-md rounded-lg border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          当前账号无法发帖。请使用理大邮箱登录，并确保账号未被限制。
        </div>
      </ModulePageShell>
    );
  }

  const popularTopics = await getForumTopics(5);

  return (
    <ModulePageShell
      title="发布帖子"
      description="自由讨论区 · 分享经验、提问，或发布找搭子信息"
      back={{ href: ROUTES.forum.list, label: "自由讨论区" }}
    >
      <ForumPostForm popularTopics={popularTopics} />
    </ModulePageShell>
  );
}
