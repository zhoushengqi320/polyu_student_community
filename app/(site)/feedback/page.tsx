import Link from "next/link";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { FEEDBACK_DESCRIPTION } from "@/constants/feedback";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getFeedbackPosts } from "@/lib/db/feedback";
import { getModuleCreatePrompt } from "@/lib/utils/authPrompts";
import { Button } from "@/components/ui/button";

type FeedbackPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const [user, result] = await Promise.all([
    getSessionUser(),
    getFeedbackPosts({ page }),
  ]);
  const createPrompt = getModuleCreatePrompt(
    user,
    "feedback",
    {
      login: "登录后反馈",
      banned: "账号受限",
      unverified: "认证后反馈",
    },
    ROUTES.feedback.new,
  );

  return (
    <ModulePageShell
      title="问题反馈"
      description={FEEDBACK_DESCRIPTION}
      back={{ href: ROUTES.home, label: "首页" }}
      actions={
        createPrompt ? (
          <Button variant="outline" asChild>
            <Link href={createPrompt.href}>{createPrompt.label}</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={ROUTES.feedback.new}>提交反馈</Link>
          </Button>
        )
      }
    >
      <FeedbackList result={result} />
    </ModulePageShell>
  );
}
