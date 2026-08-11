"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction } from "@/lib/notifications/actions";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type Notification } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils/cn";

type NotificationListProps = {
  notifications: Notification[];
};

export function NotificationList({ notifications }: NotificationListProps) {
  const [pending, startTransition] = useTransition();
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="暂无通知"
        description="举报处理、内容审核等系统消息会显示在这里。"
      />
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={handleMarkAllRead}
          >
            {pending ? "处理中..." : "全部标为已读"}
          </Button>
        </div>
      ) : null}

      <ul className="divide-y rounded-xl border">
        {notifications.map((item) => {
          const content = (
            <div
              className={cn(
                "px-4 py-4 transition-colors hover:bg-muted/40",
                !item.readAt && "bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
                {!item.readAt ? (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </p>
            </div>
          );

          return (
            <li key={item.id}>
              {item.link ? (
                <Link href={item.link} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
