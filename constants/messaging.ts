import { formatMessagePreviewText } from "@/lib/messages/formatMessageQuote";

export const MESSAGE_CONTENT_TYPES = [
  "text",
  "image",
  "video",
  "mixed",
] as const;

export type MessageContentType = (typeof MESSAGE_CONTENT_TYPES)[number];

export const MESSAGE_LIMITS = {
  maxBodyLength: 5000,
  maxImagesPerMessage: 3,
  maxVideosPerMessage: 1,
  maxImageBytes: 5 * 1024 * 1024,
  maxVideoBytes: 50 * 1024 * 1024,
/** 客户端轮询间隔（毫秒） */
  pollIntervalMs: 5000,
  /** 撤回时限（毫秒） */
  recallWindowMs: 2 * 60 * 1000,
  messagesPageSize: 50,
  /** 搜索定位消息后高亮时长（毫秒） */
  searchHighlightMs: 1000,
} as const;

/** 私信输入框可选表情 */
export const MESSAGE_COMPOSER_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🫢",
  "🤫",
  "🤔",
  "🫡",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "🙄",
  "😏",
  "😣",
  "😥",
  "😮",
  "😯",
  "😲",
  "😳",
  "🥺",
  "🥹",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "😱",
  "😨",
  "😰",
  "😓",
  "😴",
  "🤤",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "👍",
  "👎",
  "👊",
  "✊",
  "🤝",
  "🙏",
  "👏",
  "🙌",
  "💪",
  "🤞",
  "✌️",
  "🤟",
  "👌",
  "🫶",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "💔",
  "❣️",
  "💕",
  "💖",
  "✨",
  "⭐",
  "🌟",
  "💫",
  "🔥",
  "💯",
  "🎉",
  "🎊",
  "🎈",
  "🎁",
  "🏆",
  "✅",
  "❌",
  "❓",
  "❗",
  "💡",
  "📌",
  "📎",
  "👀",
  "🫣",
  "🫠",
  "🤡",
  "👻",
  "💀",
  "☕",
  "🍺",
  "🍻",
  "🍕",
  "🍔",
  "🎓",
  "📚",
  "💻",
  "📱",
  "⏰",
  "🚀",
] as const;

export const MESSAGE_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MESSAGE_VIDEO_MIME = ["video/mp4", "video/webm"] as const;

export const MESSAGE_MEDIA_MIME = [
  ...MESSAGE_IMAGE_MIME,
  ...MESSAGE_VIDEO_MIME,
] as const;

export type MessageMediaMime = (typeof MESSAGE_MEDIA_MIME)[number];

export const MESSAGE_MEDIA_BUCKET = "message-media";

/** 举报私信时，可选附带的前后上下文条数 */
export const MESSAGE_REPORT_CONTEXT_RADIUS = 5;

export const MESSAGE_VIOLATION_LABEL = "此内容已违规";

export function previewLabelForMessage(input: {
  body: string | null;
  contentType: MessageContentType;
  attachmentCount: number;
}): string {
  const fromBody = formatMessagePreviewText(input.body);
  if (fromBody) {
    return fromBody;
  }
  if (input.contentType === "video" || input.contentType === "mixed") {
    const hasVideo = input.contentType === "video";
    if (hasVideo && input.attachmentCount === 0) {
      return "[视频]";
    }
  }
  if (input.attachmentCount > 0) {
    const videoOnly =
      input.contentType === "video" ||
      (input.contentType === "mixed" && !input.body?.trim());
    return videoOnly ? "[视频]" : "[图片]";
  }
  return "新消息";
}
