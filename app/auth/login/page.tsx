import Link from "next/link";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { LoginForm } from "@/components/auth/LoginForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <ModulePageShell
      title="登录"
      description="登录理大社区后可收藏、评论与发布内容。"
      actions={
        <Button variant="outline" asChild>
          <Link href={ROUTES.signup}>还没有账号？注册</Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-md space-y-4">
        <AuthNotice />
        {error === "auth_callback_failed" ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            邮箱验证失败，请重新登录或注册。
          </p>
        ) : null}
        <LoginForm />
      </div>
    </ModulePageShell>
  );
}
