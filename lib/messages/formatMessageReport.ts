import { formatDateTime } from "@/lib/utils/formatDate";
import {
  formatMessageReadableBody,
  getMessageSenderLabel,
} from "@/lib/messages/formatMessageQuote";
import { type MessageWithSender } from "@/types/message";

export type MessageReportSnapshot = {
  id: string;
  senderId: string;
  senderLabel: string;
  body: string;
  createdAt: string;
  isReported: boolean;
};

export type MessageReportMetadata = {
  messageReport: {
    includeContext: boolean;
    reportedMessageId: string;
    messages: MessageReportSnapshot[];
  };
};

const LEGACY_REPORTED_MARKER = "--- 被举报消息 ---";

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

/** 举报说明仅保存用户补充理由，不含消息正文与上下文。 */
export function formatMessageReportDescription(input: {
  userDescription?: string | null;
}): string | null {
  const userText = input.userDescription?.trim();
  return userText || null;
}

/** 从旧版 description 中提取用户补充说明（兼容历史举报）。 */
export function getLegacyMessageReportUserDescription(
  description: string | null | undefined,
): string | null {
  if (!description) {
    return null;
  }
  const markerIndex = description.indexOf(LEGACY_REPORTED_MARKER);
  if (markerIndex === -1) {
    return description.trim() || null;
  }
  return description.slice(0, markerIndex).trim() || null;
}

export function toMessageReportSnapshot(
  message: MessageWithSender,
  isReported: boolean,
): MessageReportSnapshot {
  const rawBody = message.body?.trim() ?? "";
  return {
    id: message.id,
    senderId: message.senderId,
    senderLabel: getMessageSenderLabel(message),
    body: rawBody || formatMessageBodyForReport(message),
    createdAt: message.createdAt,
    isReported,
  };
}

export function buildMessageReportMetadata(input: {
  reportedMessage: MessageWithSender;
  contextMessages?: MessageWithSender[];
  includeContext: boolean;
}): MessageReportMetadata {
  const thread = input.includeContext
    ? [...(input.contextMessages ?? []), input.reportedMessage].sort(
        (left, right) =>
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      )
    : [input.reportedMessage];

  const reportedId = input.reportedMessage.id;

  return {
    messageReport: {
      includeContext: input.includeContext,
      reportedMessageId: reportedId,
      messages: thread.map((message) =>
        toMessageReportSnapshot(message, message.id === reportedId),
      ),
    },
  };
}

export function parseMessageReportMetadata(
  metadata: Record<string, unknown> | null | undefined,
): MessageReportMetadata | null {
  const root = metadata?.messageReport;
  if (!root || typeof root !== "object") {
    return null;
  }

  const record = root as Record<string, unknown>;
  const reportedMessageId = record.reportedMessageId;
  const messages = record.messages;

  if (typeof reportedMessageId !== "string" || !Array.isArray(messages)) {
    return null;
  }

  const parsedMessages: MessageReportSnapshot[] = [];
  for (const item of messages) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.id !== "string" ||
      typeof row.senderId !== "string" ||
      typeof row.senderLabel !== "string" ||
      typeof row.body !== "string" ||
      typeof row.createdAt !== "string"
    ) {
      continue;
    }
    parsedMessages.push({
      id: row.id,
      senderId: row.senderId,
      senderLabel: row.senderLabel,
      body: row.body,
      createdAt: row.createdAt,
      isReported: row.isReported === true,
    });
  }

  if (parsedMessages.length === 0) {
    return null;
  }

  return {
    messageReport: {
      includeContext: record.includeContext === true,
      reportedMessageId,
      messages: parsedMessages,
    },
  };
}

/** @deprecated 仅用于解析旧版写入 description 的上下文文本 */
export function parseLegacyMessageReportThread(
  description: string,
): MessageReportSnapshot[] {
  const markerIndex = description.indexOf(LEGACY_REPORTED_MARKER);
  if (markerIndex === -1) {
    return [];
  }

  const body = description.slice(markerIndex + LEGACY_REPORTED_MARKER.length);
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  const messages: MessageReportSnapshot[] = [];
  let reportedMarked = false;

  for (const line of lines) {
    if (line.startsWith("---")) {
      continue;
    }
    const match = line.match(/^\[(.+?)\]\s+(.+?)：([\s\S]+)$/);
    if (!match) {
      continue;
    }
    const [, createdAt, senderLabel, text] = match;
    const isReported = !reportedMarked;
    if (isReported) {
      reportedMarked = true;
    }
    messages.push({
      id: `legacy-${messages.length}`,
      senderId: `legacy-${senderLabel}`,
      senderLabel,
      body: text,
      createdAt,
      isReported,
    });
  }

  return messages;
}
