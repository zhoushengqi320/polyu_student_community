import { redirect } from "next/navigation";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { FeedbackPostForm } from "@/components/feedback/FeedbackPostForm";
import { ROUTES } from "@/constants/routes";
import { getSessionUser } from "@/lib/auth/session";
import { canCreateInModule } from "@/lib/utils/permissions";

export default async function NewFeedbackPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.feedback.new)}`);
  }

  if (!canCreateInModule(user, "feedback")) {
    return (
      <ModulePageShell
        title="提交反馈"
        description="当前账号无法提交反馈"
        back={{ href: ROUTES.feedback.list, label: "问题反馈" }}
      >
        <p className="text-sm text-muted-foreground">
          账号可能已被限制，请通过问题反馈联系我们。
        </p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      title="提交反馈"
      description="描述你遇到的问题或建议"
      back={{ href: ROUTES.feedback.list, label: "问题反馈" }}
    >
      <FeedbackPostForm />
    </ModulePageShell>
  );
}
