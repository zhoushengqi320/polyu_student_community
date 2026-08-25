"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { ARCHIVE_APPEAL_STATUS } from "@/constants/moderation";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type OwnHiddenMessageItem } from "@/types/message";

const OPEN_APPEAL_STORAGE_KEY = "polyuhub:open-message-appeal";

/** 同页软导航 / Strict Mode 重挂载时仍能读到 */
let pendingAppealMessageId: string | null = null;

export function stashPendingMessageAppealId(messageId: string) {
  pendingAppealMessageId = messageId;
  try {
    sessionStorage.setItem(OPEN_APPEAL_STORAGE_KEY, messageId);
  } catch {
    // ignore
  }
}

export function peekPendingMessageAppealId(): string | null {
  if (pendingAppealMessageId) {
    return pendingAppealMessageId;
  }
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return sessionStorage.getItem(OPEN_APPEAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingMessageAppealId() {
  pendingAppealMessageId = null;
  try {
    sessionStorage.removeItem(OPEN_APPEAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

type HiddenMessagesPanelProps = {
  items: OwnHiddenMessageItem[];
};

function conversationHref(item: OwnHiddenMessageItem, openAppeal: boolean) {
  const params = new URLSearchParams({
    highlight: `message-${item.id}`,
  });
  if (openAppeal) {
    params.set("appeal", "1");
  }
  return `${ROUTES.messages.conversation(item.conversationId)}?${params.toString()}`;
}

export function HiddenMessagesPanel({ items }: HiddenMessagesPanelProps) {
  const router = useRouter();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="shrink-0 border-b bg-amber-50 px-3 py-2">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-900">
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
        违规私信（{items.length}）
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const name =
            item.otherUser.displayName ?? item.otherUser.username ?? "同学";
          const canAppeal =
            item.appealStatus === ARCHIVE_APPEAL_STATUS.none ||
            item.appealStatus === ARCHIVE_APPEAL_STATUS.rejected;
          const pending =
            item.appealStatus === ARCHIVE_APPEAL_STATUS.pending;
          const href = conversationHref(item, canAppeal);
          const actionLabel = canAppeal
            ? "可申诉"
            : pending
              ? "申诉中"
              : "查看";

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (canAppeal) {
                    stashPendingMessageAppealId(item.id);
                  } else {
                    clearPendingMessageAppealId();
                  }
                  router.push(href);
                }}
                className="flex w-full items-baseline rounded-md px-2 py-1.5 text-left text-xs text-amber-950 transition-colors hover:bg-amber-100"
              >
                <span className="font-medium">与 {name}</span>
                <span className="ml-1 text-amber-700">
                  {formatRelativeTime(item.createdAt)}
                </span>
                <span
                  className={
                    canAppeal
                      ? "ml-1 font-medium text-amber-900 underline underline-offset-2"
                      : "ml-1 text-amber-800"
                  }
                >
                  {actionLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
