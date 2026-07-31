import { z } from "zod";

export const SEARCH_RESULT_TYPES = [
  "all",
  "course",
  "forum",
  "study",
  "life",
  "guide",
  "food",
] as const;

export type SearchResultTypeFilter = (typeof SEARCH_RESULT_TYPES)[number];

const typeIds = SEARCH_RESULT_TYPES as unknown as [string, ...string[]];

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "关键词最多 100 字")
    .optional()
    .default(""),
  type: z.enum(typeIds).optional().default("all"),
});

export type SearchQueryValues = z.infer<typeof searchQuerySchema>;
