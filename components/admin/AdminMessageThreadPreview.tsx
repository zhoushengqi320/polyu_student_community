"use client";

import { useEffect, useRef } from "react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { QuotedMessageBody } from "@/components/messages/QuotedMessageBody";
import { MESSAGE_REPORT_CONTEXT_RADIUS } from "@/constants/messaging";
import { type MessageReportSnapshot } from "@/lib/messages/formatMessageReport";
import { cn } from "@/lib/utils/cn";
import { formatDateTimeSafe } from "@/lib/utils/formatDate";

type AdminMessageThreadPreviewProps = {
  messages: MessageReportSnapshot[];
};

export function AdminMessageThreadPreview({
  messages,
}: AdminMessageThreadPreviewProps) {
  const senderOrder = [...new Set(messages.map((message) => message.senderId))];
  const listRef = useRef<HTMLDivElement>(null);
  const reportedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const item = reportedRef.current;
    if (!list || !item) {
      return;
    }
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    list.scrollTop +=
      itemRect.top - listRect.top - list.clientHeight / 2 + itemRect.height / 2;
  }, [messages]);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        对话上下文（被举报消息前后各最多 {MESSAGE_REPORT_CONTEXT_RADIUS} 条）
      </p>
      <div
        ref={listRef}
        className="max-h-[min(60vh,32rem)] space-y-3 overflow-y-auto pr-1"
      >
        {messages.map((message) => {
          const isRight = senderOrder.indexOf(message.senderId) === 1;

          return (
            <div
              key={message.id}
              ref={message.isReported ? reportedRef : undefined}
              className={cn(
                "flex gap-2",
                isRight ? "flex-row-reverse" : "flex-row",
              )}
            >
              {!isRight ? (
                <UserAvatar name={message.senderLabel} size="sm" className="mt-1 shrink-0" />
              ) : null}
              <div
                className={cn(
                  "flex max-w-[min(100%,32rem)] flex-col gap-1",
                  isRight ? "items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
                    isRight ? "justify-end" : "justify-start",
                  )}
                >
                  <span className="font-medium text-foreground">
                    {message.senderLabel}
                  </span>
                  <span>{formatDateTimeSafe(message.createdAt)}</span>
                  {message.isReported ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      被举报
                    </span>
                  ) : null}
                </div>
                <div
                  className={cn(
                    "inline-block max-w-full rounded-2xl px-3 py-2 text-sm leading-6",
                    message.isReported
                      ? "border-2 border-amber-400 bg-amber-50 text-foreground"
                      : isRight
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                  )}
                >
                  <QuotedMessageBody
                    body={message.body}
                    quoteTone={
                      isRight && !message.isReported ? "inverted" : "default"
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
