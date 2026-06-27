import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { USER_ROLE_LABELS } from "@/constants/userRoles";
import { type AdminAccessBlockReason } from "@/lib/admin/session";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SessionUser } from "@/types/user";

type AdminAccessDeniedProps = {
  reason: AdminAccessBlockReason;
  user: SessionUser | null;
};

function getDeniedMessage(
  reason: AdminAccessBlockReason,
  user: SessionUser | null,
): { title: string; description: string } {
  switch (reason) {
    case "not_logged_in":
      return {
        title: "无权访问管理后台",
        description: "请先登录管理员账号后再访问此页面。",
      };
    case "profile_missing":
      return {
        title: "无法验证账号信息",
        description:
          "你已登录，但未能读取 profiles 资料。请刷新页面；若仍失败，请确认 Supabase 中该用户已有 profile 记录。",
      };
    case "banned":
      return {
        title: "账号已被封禁",
        description: "当前账号状态为 banned，无法进入管理后台。",
      };
    case "not_admin":
      return {
        title: "无权访问管理后台",
        description: user?.profile
          ? `当前账号角色为「${USER_ROLE_LABELS[user.profile.role]}」，不是管理员。请在 Supabase 中将 profiles.role 设为 admin。`
          : "当前账号没有管理员权限。如需开通，请在 Supabase 执行：UPDATE profiles SET role = 'admin' WHERE id = '你的用户UUID';",
      };
    default:
      return {
        title: "无权访问管理后台",
        description: "当前账号无法访问此页面。",
      };
  }
}

export function AdminAccessDenied({ reason, user }: AdminAccessDeniedProps) {
  const { title, description } = getDeniedMessage(reason, user);

  return (
    <div className="container py-16">
      <Card className="mx-auto max-w-lg border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          {user?.profile ? (
            <p className="pt-2 text-xs text-muted-foreground">
              当前用户 ID：{user.id}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          {reason === "not_logged_in" ? (
            <>
              <Button asChild>
                <Link href={ROUTES.login}>登录</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={ROUTES.home}>返回首页</Link>
              </Button>
            </>
          ) : (
            <Button variant="outline" asChild>
              <Link href={ROUTES.home}>返回首页</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
