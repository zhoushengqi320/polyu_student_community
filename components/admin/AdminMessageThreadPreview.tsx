"use client";

import { UserAvatar } from "@/components/common/UserAvatar";
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

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">对话上下文</p>
      <div className="max-h-[min(52vh,28rem)] space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => {
          const isRight = senderOrder.indexOf(message.senderId) === 1;

          return (
            <div
              key={message.id}
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
                  isRight ? "items-end text-right" : "items-start text-left",
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
                    "inline-block whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6",
                    message.isReported
                      ? "border-2 border-amber-400 bg-amber-50 text-foreground"
                      : isRight
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                  )}
                >
                  {message.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
