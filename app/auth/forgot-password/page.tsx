import { AuthNotice } from "@/components/auth/AuthNotice";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";

export default function ForgotPasswordPage() {
  return (
    <ModulePageShell title="忘记密码" description="通过邮箱验证码重置密码。">
      <div className="mx-auto max-w-md space-y-4">
        <AuthNotice />
        <ForgotPasswordForm />
      </div>
    </ModulePageShell>
  );
}
