import { z } from "zod";
import { REPORT_REASONS } from "@/constants/reportReasons";
import {
  MESSAGE_CONTENT_TYPES,
  MESSAGE_LIMITS,
  MESSAGE_MEDIA_MIME,
} from "@/constants/messaging";

function normalizeStringList(raw: unknown): string[] {
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean);
  }
  return [];
}

const attachmentUrlsSchema = z
  .preprocess(normalizeStringList, z.array(z.string().url()))
  .refine((items) => items.length <= MESSAGE_LIMITS.maxImagesPerMessage, {
    message: `最多 ${MESSAGE_LIMITS.maxImagesPerMessage} 张图片`,
  });

const attachmentMimeTypesSchema = z.preprocess(
  normalizeStringList,
  z.array(z.enum(MESSAGE_MEDIA_MIME)),
);

export const sendMessageSchema = z
  .object({
    conversationId: z.string().uuid("无效的会话 ID"),
    body: z.preprocess((value) => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }, z.string().max(MESSAGE_LIMITS.maxBodyLength, "消息过长").nullable()),
    attachmentUrls: attachmentUrlsSchema.optional().default([]),
    attachmentMimeTypes: attachmentMimeTypesSchema.optional().default([]),
    quoteMessageId: z
      .preprocess((value) => {
        if (typeof value !== "string" || !value.trim()) return null;
        return value.trim();
      }, z.string().uuid().nullable())
      .optional()
      .default(null),
  })
  .superRefine((data, ctx) => {
    const urls = data.attachmentUrls ?? [];
    const mimes = data.attachmentMimeTypes ?? [];
    if (urls.length === 0 && !data.body) {
      ctx.addIssue({
        code: "custom",
        message: "请输入消息或添加附件",
        path: ["body"],
      });
    }
    if (urls.length !== mimes.length) {
      ctx.addIssue({
        code: "custom",
        message: "附件信息不完整",
        path: ["attachmentUrls"],
      });
    }
    const videoCount = mimes.filter((mime) => mime.startsWith("video/")).length;
    const imageCount = mimes.filter((mime) => mime.startsWith("image/")).length;
    if (videoCount > MESSAGE_LIMITS.maxVideosPerMessage) {
      ctx.addIssue({
        code: "custom",
        message: `每条消息最多 ${MESSAGE_LIMITS.maxVideosPerMessage} 个视频`,
        path: ["attachmentUrls"],
      });
    }
    if (imageCount > MESSAGE_LIMITS.maxImagesPerMessage) {
      ctx.addIssue({
        code: "custom",
        message: `每条消息最多 ${MESSAGE_LIMITS.maxImagesPerMessage} 张图片`,
        path: ["attachmentUrls"],
      });
    }
    if (videoCount > 0 && imageCount > 0) {
      ctx.addIssue({
        code: "custom",
        message: "图片与视频请分开发送",
        path: ["attachmentUrls"],
      });
    }
  })
  .transform((data) => {
    const urls = data.attachmentUrls ?? [];
    const mimes = data.attachmentMimeTypes ?? [];
    let contentType: (typeof MESSAGE_CONTENT_TYPES)[number] = "text";
    if (urls.length > 0) {
      const hasVideo = mimes.some((mime) => mime.startsWith("video/"));
      if (hasVideo) {
        contentType = data.body ? "mixed" : "video";
      } else if (data.body) {
        contentType = "mixed";
      } else {
        contentType = "image";
      }
    }
    return {
      ...data,
      attachmentUrls: urls,
      attachmentMimeTypes: mimes,
      contentType,
    };
  });

export const conversationIdSchema = z.object({
  conversationId: z.string().uuid(),
});

export const startConversationSchema = z.object({
  otherUserId: z.string().uuid("无效的用户 ID"),
});

export const messageReportSchema = z.object({
  messageId: z.string().uuid("无效的消息 ID"),
  reason: z.enum(
    REPORT_REASONS.map((item) => item.id) as [
      (typeof REPORT_REASONS)[number]["id"],
      ...(typeof REPORT_REASONS)[number]["id"][],
    ],
    { message: "请选择举报原因" },
  ),
  description: z.string().max(500).optional().nullable(),
  includeContext: z.preprocess(
    (value) => value === "on" || value === true || value === "true",
    z.boolean(),
  ),
});

export const messageAppealSchema = z.object({
  messageId: z.string().uuid("无效的消息 ID"),
  appealNote: z
    .string()
    .trim()
    .min(5, "申诉理由至少 5 个字")
    .max(500, "申诉理由最多 500 字"),
});

export const messageSearchSchema = z.object({
  conversationId: z.string().uuid(),
  query: z.string().trim().min(1, "请输入搜索关键词").max(100),
});

export const messageRecallSchema = z.object({
  messageId: z.string().uuid(),
  conversationId: z.string().uuid(),
});

export const messageBlockSchema = z.object({
  otherUserId: z.string().uuid(),
});
