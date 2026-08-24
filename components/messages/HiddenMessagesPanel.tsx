"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ARCHIVE_APPEAL_STATUS_LABELS } from "@/constants/moderation";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type OwnHiddenMessageItem } from "@/types/message";

type HiddenMessagesPanelProps = {
  items: OwnHiddenMessageItem[];
};

export function HiddenMessagesPanel({ items }: HiddenMessagesPanelProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="shrink-0 border-b bg-amber-50 px-3 py-2">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-900">
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
        违规私信（{items.length}）
      </p>
      <p className="mb-2 text-[11px] leading-4 text-amber-800/90">
        这些消息仅在会话中对你显示为违规，可点进去申诉。不会出现在「我的作品」。
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const name =
            item.otherUser.displayName ?? item.otherUser.username ?? "同学";
          return (
            <li key={item.id}>
              <Link
                href={`${ROUTES.messages.conversation(item.conversationId)}?highlight=message-${item.id}`}
                className="block rounded-md px-2 py-1.5 text-xs text-amber-950 transition-colors hover:bg-amber-100"
              >
                <span className="font-medium">与 {name}</span>
                <span className="ml-1 text-amber-800">
                  · {ARCHIVE_APPEAL_STATUS_LABELS[item.appealStatus]}
                </span>
                <span className="ml-1 text-amber-700">
                  · {formatRelativeTime(item.createdAt)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
