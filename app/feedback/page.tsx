import Link from "next/link";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { FEEDBACK_DESCRIPTION } from "@/constants/feedback";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { getFeedbackPosts } from "@/lib/db/feedback";
import { canCreateInModule } from "@/lib/utils/permissions";
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
  const canCreate = canCreateInModule(user, "feedback");

  return (
    <ModulePageShell
      title="问题反馈"
      description={FEEDBACK_DESCRIPTION}
      actions={
        canCreate ? (
          <Button asChild>
            <Link href={ROUTES.feedback.new}>提交反馈</Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={ROUTES.login}>登录后反馈</Link>
          </Button>
        )
      }
    >
      <FeedbackList result={result} />
    </ModulePageShell>
  );
}
