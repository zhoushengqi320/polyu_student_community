import { z } from "zod";
import {
  FORUM_MAX_TOPIC_LENGTH,
  FORUM_MAX_TOPICS,
  FORUM_TOPIC_SUGGESTIONS,
} from "@/constants/forum";

function normalizeTopics(raw: unknown): string[] {
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return [];
}

const topicSchema = z
  .string()
  .trim()
  .min(1, "话题不能为空")
  .max(FORUM_MAX_TOPIC_LENGTH, `话题最多 ${FORUM_MAX_TOPIC_LENGTH} 个字符`);

export const forumPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "标题至少 5 个字符")
    .max(120, "标题最多 120 个字符"),
  content: z
    .string()
    .trim()
    .min(10, "内容至少 10 个字符")
    .max(5000, "内容最多 5000 个字符"),
  topics: z
    .preprocess(normalizeTopics, z.array(topicSchema))
    .refine((items) => items.length <= FORUM_MAX_TOPICS, {
      message: `最多添加 ${FORUM_MAX_TOPICS} 个话题`,
    }),
  isAnonymous: z
    .preprocess((value) => value === "on" || value === true || value === "true", z.boolean())
    .optional()
    .default(false),
});

export type ForumPostFormValues = z.infer<typeof forumPostSchema>;

export const forumTopicSuggestions = [...FORUM_TOPIC_SUGGESTIONS];
