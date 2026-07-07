import { z } from "zod";
import {
  COURSE_MAX_REVIEW_TAGS,
  COURSE_REVIEW_TAGS,
} from "@/constants/courseOptions";

const tagValues = COURSE_REVIEW_TAGS as readonly string[];
const tagIds = COURSE_REVIEW_TAGS as unknown as [
  string,
  ...string[],
];

const ratingSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim()) {
      return Number(value);
    }
    return value;
  },
  z.number().int().min(1, "评分至少 1 分").max(5, "评分最多 5 分"),
);

function normalizeTags(raw: unknown): string[] {
  const values =
    typeof raw === "string"
      ? raw.split(",")
      : Array.isArray(raw)
        ? raw.map(String)
        : [];

  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

export const courseReviewSchema = z.object({
  courseId: z.string().uuid(),
  overallRating: ratingSchema,
  difficultyRating: ratingSchema,
  tags: z
    .preprocess(normalizeTags, z.array(z.enum(tagIds)))
    .refine((items) => items.every((item) => tagValues.includes(item)), {
      message: "包含无效标签",
    })
    .refine((items) => items.length <= COURSE_MAX_REVIEW_TAGS, {
      message: `最多选择 ${COURSE_MAX_REVIEW_TAGS} 个标签`,
    }),
  reviewText: z
    .string()
    .trim()
    .min(10, "评价内容至少 10 个字")
    .max(5000, "评价内容最多 5000 个字"),
  isAnonymous: z
    .preprocess((value) => value === "on" || value === true || value === "true", z.boolean())
    .optional()
    .default(true),
});

export type CourseReviewFormValues = z.infer<typeof courseReviewSchema>;
