import Link from "next/link";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { LoginForm } from "@/components/auth/LoginForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { POLYU_EMAIL_SUFFIX } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <ModulePageShell
      title="理大邮箱登录"
      description={`使用 ${POLYU_EMAIL_SUFFIX} 邮箱接收 Magic Link 登录，无需密码注册。`}
    >
      <div className="mx-auto max-w-md space-y-4">
        <AuthNotice />
        {error === "auth_callback_failed" ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            邮箱验证失败，请重新请求登录链接。
          </p>
        ) : null}
        <LoginForm />
        <p className="text-center text-xs text-muted-foreground">
          继续使用即表示你同意我们的
          <Link
            href={ROUTES.about.communityRules}
            className="mx-1 underline underline-offset-2 hover:text-foreground"
          >
            社区规则
          </Link>
          、
          <Link
            href={ROUTES.about.terms}
            className="mx-1 underline underline-offset-2 hover:text-foreground"
          >
            网站使用条款
          </Link>
          与
          <Link
            href={ROUTES.about.privacy}
            className="mx-1 underline underline-offset-2 hover:text-foreground"
          >
            私隐政策
          </Link>
          。
        </p>
      </div>
    </ModulePageShell>
  );
}
