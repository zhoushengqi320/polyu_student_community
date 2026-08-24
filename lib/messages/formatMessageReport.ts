import { formatDateTime } from "@/lib/utils/formatDate";
import {
  formatMessageReadableBody,
  getMessageSenderLabel,
} from "@/lib/messages/formatMessageQuote";
import { type MessageWithSender } from "@/types/message";

export function formatMessageBodyForReport(message: MessageWithSender): string {
  const readable = formatMessageReadableBody(message.body);
  if (readable) {
    return readable;
  }
  if (message.attachmentUrls.length === 0) {
    return "(空消息)";
  }
  const hasVideo = message.attachmentMimeTypes.some((mime) =>
    mime.startsWith("video/"),
  );
  return hasVideo ? "[视频附件]" : "[图片附件]";
}

export function formatMessageReportDescription(input: {
  userDescription?: string | null;
  reportedMessage: MessageWithSender;
  contextMessages?: MessageWithSender[];
}): string {
  const parts: string[] = [];
  const userText = input.userDescription?.trim();
  if (userText) {
    parts.push(userText);
  }

  parts.push("--- 被举报消息 ---");
  parts.push(
    `[${formatDateTime(input.reportedMessage.createdAt)}] ${getMessageSenderLabel(input.reportedMessage)}：${formatMessageBodyForReport(input.reportedMessage)}`,
  );

  const context = input.contextMessages ?? [];
  if (context.length > 0) {
    parts.push("--- 附加上下文（举报人同意提供） ---");
    for (const message of context) {
      if (message.id === input.reportedMessage.id) {
        continue;
      }
      parts.push(
        `[${formatDateTime(message.createdAt)}] ${getMessageSenderLabel(message)}：${formatMessageBodyForReport(message)}`,
      );
    }
  }

  return parts.join("\n\n");
}
