"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type MessageInboxIconProps = {
  unreadCount: number;
  className?: string;
};

export function MessageInboxIcon({
  unreadCount,
  className,
}: MessageInboxIconProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      asChild
    >
      <Link href={ROUTES.messages.list} aria-label="我的私信">
        <MessageCircle className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
