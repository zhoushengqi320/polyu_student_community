import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { getSessionUser } from "@/lib/auth/session";
import { needsOnboarding } from "@/lib/auth/onboarding";
import { ROUTES } from "@/constants/routes";

export default async function OnboardingPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  if (!needsOnboarding(user.profile)) {
    redirect(ROUTES.home);
  }

  if (!user.profile) {
    redirect(ROUTES.login);
  }

  return (
    <ModulePageShell
      title="完善资料"
      description="首次登录需填写基础信息，以便其他同学认识你。"
    >
      <OnboardingForm profile={user.profile} />
    </ModulePageShell>
  );
}
