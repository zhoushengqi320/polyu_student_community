"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/notifications/actions";
import { NOTIFICATION_TYPES } from "@/constants/moderation";
import { ROUTES } from "@/constants/routes";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type Notification } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { CommunityRulesDialog } from "@/components/legal/CommunityRulesDialog";
import { cn } from "@/lib/utils/cn";
import { usePostgresChanges } from "@/hooks/usePostgresChanges";

type NotificationListProps = {
  notifications: Notification[];
  userId: string;
};

const INLINE_DETAIL_TYPES = new Set<string>([
  NOTIFICATION_TYPES.contentRemoved,
  NOTIFICATION_TYPES.reportResolved,
  NOTIFICATION_TYPES.reportSubmitted,
  NOTIFICATION_TYPES.contentAutoHidden,
  NOTIFICATION_TYPES.contentRestored,
  NOTIFICATION_TYPES.reportDismissed,
  NOTIFICATION_TYPES.reporterWarning,
  NOTIFICATION_TYPES.reporterBanned,
  NOTIFICATION_TYPES.contentPendingReview,
  NOTIFICATION_TYPES.archiveAppealPending,
  NOTIFICATION_TYPES.archiveAppealApproved,
  NOTIFICATION_TYPES.archiveAppealRejected,
  NOTIFICATION_TYPES.profileRejected,
]);

const INTERACTION_TYPES = new Set<string>([
  NOTIFICATION_TYPES.contentLiked,
  NOTIFICATION_TYPES.contentFavorited,
  NOTIFICATION_TYPES.contentCommented,
  NOTIFICATION_TYPES.contentReplied,
]);

const APPEAL_CTA_TYPES = new Set<string>([
  NOTIFICATION_TYPES.contentRemoved,
  NOTIFICATION_TYPES.contentAutoHidden,
]);

function shouldNavigate(link: string | null): boolean {
  if (!link) {
    return false;
  }
  if (link === ROUTES.notifications) {
    return false;
  }
  if (link === ROUTES.about.communityRules) {
    return false;
  }
  return true;
}

function interactionHint(item: Notification): string | null {
  if (!INTERACTION_TYPES.has(item.type) || !shouldNavigate(item.link)) {
    return null;
  }
  return item.body || "点击查看原帖";
}

function appealHref(item: Notification): string | null {
  if (item.link && item.link.includes("#works")) {
    return item.link;
  }
  const meta = item.metadata;
  if (meta && typeof meta === "object" && meta.canAppeal) {
    return item.link;
  }
  return item.link;
}

export function NotificationList({ notifications, userId }: NotificationListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  usePostgresChanges(
    true,
    `notifications:${userId}`,
    [{ table: "notifications", filter: `user_id=eq.${userId}` }],
    () => router.refresh(),
  );

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  function handleItemClick(item: Notification) {
    startTransition(async () => {
      if (!item.readAt) {
        await markNotificationReadAction(item.id);
      }

      if (INLINE_DETAIL_TYPES.has(item.type)) {
        setExpandedId((current) => (current === item.id ? null : item.id));
        router.refresh();
        return;
      }

      if (shouldNavigate(item.link) && item.link) {
        router.push(item.link);
        return;
      }

      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="暂无通知"
        description="互动消息（点赞、评论、回复、收藏）与系统处理结果会显示在这里。"
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
          const isInlineDetail = INLINE_DETAIL_TYPES.has(item.type);
          const isInteraction = INTERACTION_TYPES.has(item.type);
          const expanded = expandedId === item.id;
          const showAppealCta = APPEAL_CTA_TYPES.has(item.type);
          const worksLink = appealHref(item);
          const clickHint = interactionHint(item);

          return (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  "block w-full px-4 py-4 text-left transition-colors hover:bg-muted/40",
                  !item.readAt && "bg-primary/5",
                  isInteraction && !item.readAt && "border-l-2 border-l-primary",
                )}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{item.title}</p>
                    {isInteraction ? (
                      clickHint ? (
                        <p className="text-sm text-primary">{clickHint}</p>
                      ) : null
                    ) : (
                      <p className="text-sm text-muted-foreground">{item.body}</p>
                    )}
                  </div>
                  {!item.readAt ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDateTime(item.createdAt)}
                </p>
                {isInlineDetail && expanded ? (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    <p className="text-sm text-muted-foreground">
                      以上为系统通知详情。
                    </p>
                    {showAppealCta && worksLink ? (
                      <Link
                        href={worksLink}
                        className="block text-sm font-medium text-primary hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        前往「我的作品」提交申诉
                      </Link>
                    ) : null}
                    <span
                      className="block"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <CommunityRulesDialog
                        triggerLabel="查看社区规则"
                        triggerClassName="text-sm text-primary hover:underline"
                      />
                    </span>
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
