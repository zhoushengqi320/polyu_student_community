import { type MessageWithSender } from "@/types/message";

const QUOTE_LINE_PREFIX = "> ";
const PREVIEW_MAX_LENGTH = 80;
const NAME_AND_CONTENT = /^(.+?)\s*[:：]\s*([\s\S]*)$/;
const READABLE_QUOTE_BLOCK =
  /^\[引用\s+(.+?)\s*[:：]\s*([\s\S]*?)\](?:\s*\n+([\s\S]*))?$/;
const READABLE_QUOTE_UNCLOSED = /^\[引用\s+(.+?)\s*[:：]\s*([\s\S]*?)\s*\]?\s*$/;

function truncatePreview(text: string, max = PREVIEW_MAX_LENGTH): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function isQuoteLine(line: string): boolean {
  return line.startsWith(">");
}

function stripQuotePrefix(line: string): string {
  if (line.startsWith(QUOTE_LINE_PREFIX)) {
    return line.slice(QUOTE_LINE_PREFIX.length);
  }
  if (line.startsWith(">")) {
    return line.slice(1).replace(/^\s*/, "");
  }
  return line;
}

export function stripLeadingQuoteLines(text: string): string {
  const lines = text.split("\n");
  let index = 0;
  while (index < lines.length && isQuoteLine(lines[index])) {
    index += 1;
  }
  return lines.slice(index).join("\n").trim();
}

function parseReadableQuoteWrapper(text: string): {
  senderName: string;
  previewText: string;
  replyText: string;
} | null {
  const trimmed = text.trim();
  const closed = trimmed.match(READABLE_QUOTE_BLOCK);
  if (closed) {
    return {
      senderName: closed[1].trim(),
      previewText: closed[2].trim(),
      replyText: (closed[3] ?? "").trim(),
    };
  }
  const unclosed = trimmed.match(READABLE_QUOTE_UNCLOSED);
  if (!unclosed || !trimmed.startsWith("[引用")) {
    return null;
  }
  return {
    senderName: unclosed[1].trim(),
    previewText: unclosed[2].replace(/\]\s*$/, "").trim(),
    replyText: "",
  };
}

function flattenQuotePreview(preview: string, senderName?: string): string {
  let text = preview.trim();
  for (let step = 0; step < 6 && text; step += 1) {
    const wrapped = parseReadableQuoteWrapper(text);
    if (wrapped && !wrapped.replyText) {
      text = wrapped.previewText;
      continue;
    }
    const lines = text.split("\n");
    if (lines.some((line) => isQuoteLine(line))) {
      text = lines.map((line) => stripQuotePrefix(line)).join("\n").trim();
      continue;
    }
    const named = text.match(NAME_AND_CONTENT);
    if (
      named &&
      senderName &&
      named[1].trim() === senderName &&
      named[2].trim()
    ) {
      text = named[2].trim();
      continue;
    }
    break;
  }
  return text;
}

export function getMessageSenderLabel(message: MessageWithSender): string {
  return message.sender.displayName ?? message.sender.username ?? "同学";
}

export function getMessageCopyText(message: MessageWithSender): string | null {
  const { quote, replyText } = parseMessageBodyWithQuote(message.body);
  const reply = stripLeadingQuoteLines(replyText).trim();
  if (reply) {
    return reply;
  }
  if (quote) {
    return `${quote.senderName}：${quote.previewText}`;
  }

  const text = message.body?.trim();
  if (text) {
    return stripLeadingQuoteLines(text) || text;
  }
  if (message.attachmentUrls.length === 0) {
    return null;
  }
  const hasVideo = message.attachmentMimeTypes.some((mime) =>
    mime.startsWith("video/"),
  );
  if (hasVideo) {
    return message.attachmentUrls[0] ?? null;
  }
  return message.attachmentUrls.join("\n");
}

export type MessageQuotePreview = {
  senderName: string;
  previewText: string;
  kind: "text" | "image" | "video";
};

export function getMessageQuotePreview(
  message: MessageWithSender,
): MessageQuotePreview | null {
  const senderName = getMessageSenderLabel(message);
  const parsed = parseMessageBodyWithQuote(message.body);
  const replyText = stripLeadingQuoteLines(parsed.replyText).trim();

  if (replyText) {
    const flat = replyText.replace(/\s+/g, " ").trim();
    return {
      senderName,
      previewText: flat.length > 120 ? `${flat.slice(0, 120)}…` : flat,
      kind: "text",
    };
  }

  if (parsed.quote) {
    return {
      senderName,
      previewText: "引用消息",
      kind: "text",
    };
  }

  const text = message.body?.trim();
  if (text) {
    const flat = text.replace(/\s+/g, " ").trim();
    return {
      senderName,
      previewText: flat.length > 120 ? `${flat.slice(0, 120)}…` : flat,
      kind: "text",
    };
  }

  if (message.attachmentUrls.length > 0) {
    const hasVideo = message.attachmentMimeTypes.some((mime) =>
      mime.startsWith("video/"),
    );
    return {
      senderName,
      previewText: hasVideo ? "[视频]" : "[图片]",
      kind: hasVideo ? "video" : "image",
    };
  }

  return null;
}

/** 会话列表、通知等场景的摘要文案（不含 > 等存储格式字符） */
export function formatMessagePreviewText(body: string | null): string {
  if (!body?.trim()) {
    return "";
  }

  const { quote, replyText } = parseMessageBodyWithQuote(body);
  const reply = stripLeadingQuoteLines(replyText).trim();
  if (reply) {
    return truncatePreview(reply.replace(/\s+/g, " ").trim());
  }
  if (quote) {
    return truncatePreview(
      `${quote.senderName}：${quote.previewText}`.replace(/\s+/g, " ").trim(),
    );
  }

  const cleaned = stripLeadingQuoteLines(body).replace(/\s+/g, " ").trim();
  return truncatePreview(cleaned || body.trim());
}

/** 管理员举报、上下文预览等可读正文 */
export function formatMessageReadableBody(body: string | null): string {
  if (!body?.trim()) {
    return "";
  }

  const { quote, replyText } = parseMessageBodyWithQuote(body);
  const reply = stripLeadingQuoteLines(replyText).trim();
  if (quote && reply) {
    return `[引用 ${quote.senderName}：${quote.previewText}]\n${reply}`;
  }
  if (quote) {
    return `[引用 ${quote.senderName}：${quote.previewText}]`;
  }
  return stripLeadingQuoteLines(body) || body.trim();
}

/** @deprecated 仅用于判断是否可引用，请优先使用 getMessageQuotePreview */
export function formatMessageQuote(message: MessageWithSender): string {
  return formatMessageQuoteBlock(message);
}

export function formatMessageQuoteBlock(message: MessageWithSender): string {
  const name = getMessageSenderLabel(message);
  const parsed = parseMessageBodyWithQuote(message.body);
  const replyText = stripLeadingQuoteLines(parsed.replyText).trim();

  if (replyText) {
    const lines = replyText.split("\n");
    const quoted = lines.map((line, index) =>
      index === 0
        ? `${QUOTE_LINE_PREFIX}${name}：${line}`
        : `${QUOTE_LINE_PREFIX}${line}`,
    );
    return `${quoted.join("\n")}\n\n`;
  }

  if (parsed.quote) {
    return `${QUOTE_LINE_PREFIX}${name}：引用消息\n\n`;
  }

  const text = message.body?.trim();
  if (text) {
    const lines = text.split("\n");
    const quoted = lines.map((line, index) =>
      index === 0
        ? `${QUOTE_LINE_PREFIX}${name}：${line}`
        : `${QUOTE_LINE_PREFIX}${line}`,
    );
    return `${quoted.join("\n")}\n\n`;
  }

  if (message.attachmentUrls.length > 0) {
    const hasVideo = message.attachmentMimeTypes.some((mime) =>
      mime.startsWith("video/"),
    );
    const label = hasVideo ? "视频" : "图片";
    return `${QUOTE_LINE_PREFIX}${name}：[${label}]\n\n`;
  }

  return "";
}

export function buildMessageBodyWithQuote(
  quote: MessageWithSender,
  replyBody: string,
): string {
  const block = formatMessageQuoteBlock(quote);
  const trimmedReply = replyBody.trim();
  if (!block) {
    return trimmedReply;
  }
  if (!trimmedReply) {
    return block.trimEnd();
  }
  return `${block}${trimmedReply}`;
}

export function parseMessageBodyWithQuote(body: string | null): {
  quote: { senderName: string; previewText: string } | null;
  replyText: string;
} {
  if (!body?.trim()) {
    return { quote: null, replyText: body ?? "" };
  }

  const wrapped = parseReadableQuoteWrapper(body);
  if (wrapped) {
    return {
      quote: {
        senderName: wrapped.senderName,
        previewText:
          flattenQuotePreview(wrapped.previewText, wrapped.senderName) || "…",
      },
      replyText: stripLeadingQuoteLines(wrapped.replyText),
    };
  }

  const lines = body.split("\n");
  if (!isQuoteLine(lines[0] ?? "")) {
    return { quote: null, replyText: body };
  }

  const quoteRawLines: string[] = [];
  let index = 0;
  while (index < lines.length && isQuoteLine(lines[index])) {
    quoteRawLines.push(stripQuotePrefix(lines[index]));
    index += 1;
  }
  while (index < lines.length && lines[index].trim() === "") {
    index += 1;
  }

  const replyText = stripLeadingQuoteLines(lines.slice(index).join("\n"));
  if (quoteRawLines.length === 0) {
    return { quote: null, replyText: body };
  }

  const firstLine = quoteRawLines[0];
  const named = firstLine.match(NAME_AND_CONTENT);
  if (!named) {
    const previewText = flattenQuotePreview(quoteRawLines.join("\n").trim());
    return {
      quote: {
        senderName: "引用",
        previewText: previewText || "…",
      },
      replyText,
    };
  }

  const senderName = named[1].trim();
  const firstContent = named[2];
  const previewParts = [firstContent, ...quoteRawLines.slice(1)].filter(
    (part) => part.length > 0,
  );
  const previewText =
    flattenQuotePreview(previewParts.join("\n").trim(), senderName) || "…";

  return {
    quote: { senderName, previewText },
    replyText,
  };
}

export function getMessageTextForTranslation(body: string | null): string {
  const { quote, replyText } = parseMessageBodyWithQuote(body);
  if (quote && replyText.trim()) {
    return replyText.trim();
  }
  if (quote && !replyText.trim()) {
    return quote.previewText;
  }
  return body?.trim() ?? "";
}

/** 是否可对消息使用翻译（纯图片/视频无文字时不可用） */
export function canTranslateMessageContent(input: {
  body: string | null;
  attachmentCount: number;
}): boolean {
  const text = getMessageTextForTranslation(input.body);
  return text.length > 0;
}
