import Link from "next/link";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { SignupForm } from "@/components/auth/SignupForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <ModulePageShell
      title="注册"
      description="注册理大社区账号，完成理大认证后可发布内容。"
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.login}>已有账号？登录</Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-md space-y-4">
        <AuthNotice />
        <SignupForm />
      </div>
    </ModulePageShell>
  );
}
