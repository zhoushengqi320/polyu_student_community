"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { AuthButtons, UserMenu } from "@/components/auth/UserMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { isFeatureEnabled } from "@/constants/features";
import { AUTH_NAV_ITEMS, NAV_ITEMS, ROUTES } from "@/constants/routes";
import { SITE_LOGO, SITE_NAME } from "@/constants/site";
import { can } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { type SessionUser } from "@/types/user";

type NavbarContentProps = {
  user: SessionUser | null;
  unreadNotificationCount?: number;
};

export function NavbarContent({
  user,
  unreadNotificationCount = 0,
}: NavbarContentProps) {
  return (
    <header className="site-header sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="site-header-inner flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <Link href={ROUTES.home} className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {SITE_LOGO}
            </span>
            <span className="hidden font-semibold sm:inline">{SITE_NAME}</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.route}
                prefetch={false}
                className="rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground xl:px-3"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* 从右至左：反馈 → 头像 → 通知 → 管理后台（admin） */}
        <div className="flex h-full shrink-0 items-center gap-2">
          <div className="hidden h-full items-center gap-2 lg:flex">
            {user ? (
              <>
                {can(user, "admin:access") ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={ROUTES.admin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      管理后台
                    </Link>
                  </Button>
                ) : null}
                {isFeatureEnabled("notifications") ? (
                  <NotificationBell unreadCount={unreadNotificationCount} />
                ) : null}
                <UserMenu user={user} />
              </>
            ) : (
              <AuthButtons />
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {user && isFeatureEnabled("notifications") ? (
              <NotificationBell unreadCount={unreadNotificationCount} />
            ) : null}
            <MobileNav
              user={user}
              trigger={
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">打开菜单</span>
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileNavLinks({ user }: { user: SessionUser | null }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.route}
          prefetch={false}
          className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          {item.label}
        </Link>
      ))}
      <div className="my-2 border-t" />
      {user ? (
        <UserMenu user={user} variant="mobile" />
      ) : (
        AUTH_NAV_ITEMS.map((item) => (
          <Button key={item.href} variant="ghost" className="justify-start" asChild>
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))
      )}
    </nav>
  );
}
