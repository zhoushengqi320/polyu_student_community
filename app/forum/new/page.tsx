import Link from "next/link";
import { redirect } from "next/navigation";
import { MODULE_REGISTRY } from "@/constants/modules";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { PostForm } from "@/components/posts/PostForm";
import { getSessionUser } from "@/lib/auth/session";
import { ROUTES } from "@/constants/routes";
import { canCreateInModule } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";

export default async function NewForumPostPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.forum.new)}`);
  }

  if (!canCreateInModule(user, "forum")) {
    return (
      <ModulePageShell
        title="发布帖子"
        description={`${MODULE_REGISTRY.forum.label} · 需要理大认证`}
        actions={
          <Button variant="outline" asChild>
            <Link href={ROUTES.forum.list}>返回讨论区</Link>
          </Button>
        }
      >
        <div className="mx-auto max-w-md rounded-lg border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          你需要完成理大认证才能发帖。请联系管理员或等待认证功能上线。
        </div>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      title="发布帖子"
      description={`${MODULE_REGISTRY.forum.label} · 分享你的经验与问题`}
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.forum.list}>返回讨论区</Link>
        </Button>
      }
    >
      <PostForm />
    </ModulePageShell>
  );
}
