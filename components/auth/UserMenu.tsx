"use client";

import Link from "next/link";
import { CircleHelp, LogOut, Shield, Bookmark } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { logoutFormAction } from "@/lib/auth/actions";
import { ROUTES } from "@/constants/routes";
import { USER_ROLE_LABELS } from "@/constants/userRoles";
import { can } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { type SessionUser } from "@/types/user";

type UserMenuProps = {
  user: SessionUser;
  variant?: "desktop" | "mobile";
};

function getDisplayName(user: SessionUser): string {
  return user.profile?.displayName ?? "PolyU 同学";
}

export function UserMenu({ user, variant = "desktop" }: UserMenuProps) {
  const displayName = getDisplayName(user);
  const avatarUrl = user.profile?.avatarUrl;
  const profileHref = ROUTES.profile(user.id);
  const roleLabel = user.profile
    ? USER_ROLE_LABELS[user.profile.role]
    : "用户";
  const showAdminLink = can(user, "admin:access");

  if (variant === "mobile") {
    return (
      <div className="space-y-2">
        <Link
          href={profileHref}
          className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 transition-colors hover:bg-muted/80"
        >
          <UserAvatar src={avatarUrl} name={displayName} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </Link>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href={`${profileHref}#favorites`}>
            <Bookmark className="mr-2 h-4 w-4" />
            我的收藏
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href={ROUTES.feedback.list}>
            <CircleHelp className="mr-2 h-4 w-4" />
            问题反馈
          </Link>
        </Button>
        {showAdminLink ? (
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href={ROUTES.admin}>
              <Shield className="mr-2 h-4 w-4" />
              管理后台
            </Link>
          </Button>
        ) : null}
        <form action={logoutFormAction}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {showAdminLink ? (
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.admin}>管理后台</Link>
        </Button>
      ) : null}
      <Link
        href={profileHref}
        title={displayName}
        aria-label={`${displayName} 的个人主页`}
        className="inline-flex items-center rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <UserAvatar src={avatarUrl} name={displayName} size="xl" />
      </Link>
      <Button variant="outline" size="sm" asChild>
        <Link href={ROUTES.feedback.list} title="问题反馈">
          <CircleHelp className="mr-1.5 h-4 w-4" />
          反馈
        </Link>
      </Button>
    </div>
  );
}

type AuthButtonsProps = {
  variant?: "desktop" | "mobile";
};

export function AuthButtons({ variant = "desktop" }: AuthButtonsProps) {
  const buttonClass = variant === "mobile" ? "w-full justify-start" : "";

  return (
    <div className={variant === "mobile" ? "space-y-1" : "flex items-center gap-2"}>
      <Button variant="ghost" size="sm" className={buttonClass} asChild>
        <Link href={ROUTES.login}>登录</Link>
      </Button>
      <Button variant="default" size="sm" className={buttonClass} asChild>
        <Link href={ROUTES.signup}>注册</Link>
      </Button>
    </div>
  );
}
