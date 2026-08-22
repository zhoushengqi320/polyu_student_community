import { AuthNotice } from "@/components/auth/AuthNotice";
import { LoginForm } from "@/components/auth/LoginForm";
import { ModulePageShell } from "@/components/common/ModulePageShell";
import { AuthLegalFooter } from "@/components/legal/AuthLegalFooter";
import { isMagicLinkEnabled, POLYU_EMAIL_SUFFIX } from "@/constants/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;
  const nextPath = next?.trim() || undefined;

  return (
    <ModulePageShell
      title="登录"
      description={`使用 ${POLYU_EMAIL_SUFFIX} 邮箱登录。支持密码或验证码登录。`}
    >
      <div className="mx-auto max-w-md space-y-4">
        <AuthNotice />
        {error === "auth_callback_failed" ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            邮箱验证失败，请重新登录。
          </p>
        ) : null}
        <LoginForm magicLinkEnabled={isMagicLinkEnabled()} nextPath={nextPath} />
        <AuthLegalFooter prefix="继续使用即表示你同意我们的" />
      </div>
    </ModulePageShell>
  );
}
