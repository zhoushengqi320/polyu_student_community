"use client";

import { MessageQuotePreviewBar } from "@/components/messages/MessageQuotePreviewBar";
import {
  parseMessageBodyWithQuote,
  stripLeadingQuoteLines,
} from "@/lib/messages/formatMessageQuote";
import { cn } from "@/lib/utils/cn";

type QuotedMessageBodyProps = {
  body: string | null | undefined;
  className?: string;
  quoteTone?: "default" | "inverted";
};

export function QuotedMessageBody({
  body,
  className,
  quoteTone = "default",
}: QuotedMessageBodyProps) {
  const raw = body?.trim() ?? "";
  if (!raw) {
    return <p className={cn("text-sm text-muted-foreground", className)}>（空消息）</p>;
  }

  const parsed = parseMessageBodyWithQuote(raw);
  const senderName = parsed.quote?.senderName;
  const previewText = parsed.quote?.previewText;
  const replyText = stripLeadingQuoteLines(parsed.replyText).trim();

  if (!senderName || !previewText) {
    return (
      <p className={cn("whitespace-pre-wrap break-words text-sm leading-6", className)}>
        {replyText || raw}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2 text-left", className)}>
      <MessageQuotePreviewBar
        senderName={senderName}
        previewText={previewText}
        compact
        tone={quoteTone}
      />
      {replyText ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{replyText}</p>
      ) : null}
    </div>
  );
}
