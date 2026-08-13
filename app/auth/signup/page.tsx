import { AuthNotice } from "@/components/auth/AuthNotice";
import { SignupWizard } from "@/components/auth/SignupWizard";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { AuthLegalFooter } from "@/components/legal/AuthLegalFooter";
import { POLYU_EMAIL_SUFFIX } from "@/constants/auth";
import { getRegistrationDraftByCookie } from "@/lib/auth/registrationDraft";

export default async function SignupPage() {
  const draft = await getRegistrationDraftByCookie();
  let initialStep: "email" | "otp" | "password" | "profile" = "email";
  if (draft?.password_encrypted) {
    initialStep = "profile";
  } else if (draft?.email_verified_at) {
    initialStep = "password";
  } else if (draft?.email) {
    initialStep = "otp";
  }

  return (
    <ModulePageShell
      title="注册"
      description={`使用 ${POLYU_EMAIL_SUFFIX} 注册 PolyUHub 账号。`}
    >
      <div className="mx-auto max-w-md space-y-4">
        <AuthNotice />
        <SignupWizard
          initialStep={initialStep}
          draftEmail={draft?.email ?? ""}
        />
        <AuthLegalFooter prefix="注册即表示你同意" />
      </div>
    </ModulePageShell>
  );
}
