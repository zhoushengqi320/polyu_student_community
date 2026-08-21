"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { AuthButtons, UserMenu } from "@/components/auth/UserMenu";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavbarSearch } from "@/components/layout/NavbarSearch";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { isFeatureEnabled } from "@/constants/features";
import { AUTH_NAV_ITEMS, NAV_ITEMS, ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils/cn";
import { type SessionUser } from "@/types/user";

type NavbarContentProps = {
  user: SessionUser | null;
  unreadNotificationCount?: number;
  unreadFeedbackCount?: number;
};

const NAV_LINK_CLASS =
  "rounded-md px-2.5 py-2 text-sm font-medium transition-all hover:bg-primary-foreground/10 hover:font-semibold hover:underline hover:underline-offset-4 xl:px-3";

export function NavbarContent({
  user,
  unreadNotificationCount = 0,
  unreadFeedbackCount = 0,
}: NavbarContentProps) {
  return (
    <header className="site-header sticky top-0 z-50 border-b border-primary/20 bg-primary text-primary-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-primary/95">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <SiteLogo priority className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]" />

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) =>
              item.key === "guides" ? (
                <Link
                  key={item.key}
                  href={item.route}
                  prefetch={false}
                  className={cn(
                    NAV_LINK_CLASS,
                    "inline-flex items-center gap-1.5 font-semibold",
                  )}
                >
                  {item.label}
                  <span className="rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                    专题
                  </span>
                </Link>
              ) : (
                <Link
                  key={item.key}
                  href={item.route}
                  prefetch={false}
                  className={NAV_LINK_CLASS}
                >
                  {item.label}
                </Link>
              ),
            )}
            <NavbarSearch className="ml-1" />
          </nav>
        </div>

        <div className="flex h-full shrink-0 items-center gap-3">
          <div className="hidden h-full items-center gap-3 lg:flex">
            {user ? (
              <>
                {can(user, "admin:access") ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    asChild
                  >
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
                  <NotificationBell
                    unreadCount={unreadNotificationCount}
                    className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  />
                ) : null}
                <UserMenu
                  user={user}
                  variant="header"
                  unreadFeedbackCount={unreadFeedbackCount}
                />
              </>
            ) : (
              <AuthButtons variant="header" />
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <NavbarSearch />
            {!user ? (
              <Button
                variant="secondary"
                size="sm"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link href={ROUTES.signup}>注册</Link>
              </Button>
            ) : null}
            {user && isFeatureEnabled("notifications") ? (
              <NotificationBell
                unreadCount={unreadNotificationCount}
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              />
            ) : null}
            <MobileNav
              user={user}
              unreadFeedbackCount={unreadFeedbackCount}
              trigger={
                <Button
                  variant="outline"
                  size="icon"
                  className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                >
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

export function MobileNavLinks({
  user,
  unreadFeedbackCount = 0,
}: {
  user: SessionUser | null;
  unreadFeedbackCount?: number;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.route}
          prefetch={false}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
            item.key === "guides" && "flex items-center gap-2 font-semibold text-primary",
          )}
        >
          {item.label}
          {item.key === "guides" ? (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
              专题
            </span>
          ) : null}
        </Link>
      ))}
      <div className="my-2 border-t" />
      {user ? (
        <>
          {can(user, "admin:access") ? (
            <Button variant="ghost" className="justify-start" asChild>
              <Link
                href={ROUTES.admin}
                target="_blank"
                rel="noopener noreferrer"
              >
                管理后台
              </Link>
            </Button>
          ) : null}
          <UserMenu
            user={user}
            variant="mobile"
            unreadFeedbackCount={unreadFeedbackCount}
          />
        </>
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
