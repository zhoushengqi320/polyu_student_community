"use client";

import Link from "next/link";
import { LogOut, Shield, User, Bookmark } from "lucide-react";
import { logoutFormAction } from "@/lib/auth/actions";
import { ROUTES } from "@/constants/routes";
import { USER_ROLE_LABELS } from "@/constants/userRoles";
import { isAdmin } from "@/lib/utils/permissions";
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
  const profileHref = ROUTES.profile(user.id);
  const roleLabel = user.profile
    ? USER_ROLE_LABELS[user.profile.role]
    : "用户";
  const showAdminLink = isAdmin(user);

  if (variant === "mobile") {
    return (
      <div className="space-y-2">
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href={profileHref}>
            <User className="mr-2 h-4 w-4" />
            个人主页
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href={`${profileHref}#favorites`}>
            <Bookmark className="mr-2 h-4 w-4" />
            我的收藏
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
    <div className="flex items-center gap-2">
      {showAdminLink ? (
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.admin}>管理后台</Link>
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" asChild>
        <Link href={profileHref} className="max-w-[140px] truncate">
          {displayName}
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href={`${profileHref}#favorites`}>收藏</Link>
      </Button>
      <form action={logoutFormAction}>
        <Button type="submit" variant="outline" size="sm">
          退出
        </Button>
      </form>
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
