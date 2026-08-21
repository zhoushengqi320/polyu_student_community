"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";
import { type SessionUser } from "@/types/user";

type AdminUserBarProps = {
  user: SessionUser;
};

/** 后台置顶页眉：管理员身份 + 刷新数据（保持当前 tab）。 */
export function AdminUserBar({ user }: AdminUserBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, startRefresh] = useTransition();
  const displayName = user.profile?.displayName ?? "管理员";

  function handleRefresh() {
    startRefresh(() => {
      const query = searchParams.toString();
      router.replace(query ? `${ROUTES.admin}?${query}` : ROUTES.admin);
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="container flex items-center justify-between gap-3 py-3">
        <p className="text-sm font-semibold tracking-tight">PolyUHub 管理后台</p>
        <div className="flex items-center gap-3 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "刷新中…" : "刷新数据"}
          </Button>
          <div className="flex items-center gap-2.5">
            <UserAvatar
              src={user.profile?.avatarUrl}
              name={displayName}
              size="sm"
            />
            <span className="font-medium">{displayName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
