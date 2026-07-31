import { z } from "zod";
import {
  COURSE_ASSIGNMENT_TYPES,
  COURSE_ATTENDANCE_OPTIONS,
  COURSE_EXAM_TYPES,
  COURSE_REVIEW_TAGS,
  COURSE_SEMESTERS,
  encodeExamTypeSelection,
  encodeMultiOptionIds,
  findConflictingReviewTags,
} from "@/constants/courseOptions";

const tagValues = COURSE_REVIEW_TAGS as readonly string[];
const tagIds = COURSE_REVIEW_TAGS as unknown as [string, ...string[]];
const semesterIds = COURSE_SEMESTERS.map((item) => item.id) as [
  string,
  ...string[],
];
const examTypeIds = COURSE_EXAM_TYPES.map((item) => item.id) as [
  string,
  ...string[],
];
const assignmentTypeIds = COURSE_ASSIGNMENT_TYPES.map((item) => item.id) as [
  string,
  ...string[],
];
const attendanceIds = COURSE_ATTENDANCE_OPTIONS.map((item) => item.id) as [
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
  z.number().int().min(1, "请完成星级评分").max(5, "评分最多 5 分"),
);

const optionalRatingSchema = z.preprocess((value) => {
  if (value === "" || value == null) return null;
  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }
  return value;
}, z.number().int().min(1).max(5).nullable());

function optionalEnumSchema(ids: [string, ...string[]], message: string) {
  return z.preprocess((value) => {
    if (value === "" || value == null) return null;
    return value;
  }, z.enum(ids, { message }).nullable());
}

function normalizeIdList(raw: unknown): string[] {
  const values =
    typeof raw === "string"
      ? raw.split(",")
      : Array.isArray(raw)
        ? raw.map(String)
        : [];

  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function multiOptionSchema(ids: [string, ...string[]]) {
  return z
    .preprocess(normalizeIdList, z.array(z.enum(ids)))
    .transform((items) => encodeMultiOptionIds(items));
}

export const courseReviewSchema = z
  .object({
    courseId: z.string().uuid(),
    academicYear: z
      .string()
      .trim()
      .min(1, "请选择修读学年")
      .max(20, "学年格式无效"),
    semesterTerm: z.enum(semesterIds, { message: "请选择修读学期" }),
    teacherName: z.preprocess(
      (value) => {
        if (typeof value !== "string") return null;
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
      },
      z.string().max(80, "教师姓名最多 80 字").nullable(),
    ),
    overallRating: ratingSchema,
    difficultyRating: ratingSchema,
    workloadRating: ratingSchema,
    gradingRating: ratingSchema,
    teachingRating: ratingSchema,
    examDifficulty: optionalRatingSchema,
    examTypes: z.preprocess(normalizeIdList, z.array(z.enum(examTypeIds))),
    examTypeOther: z.preprocess((value) => {
      if (typeof value !== "string") return "";
      return value.trim();
    }, z.string().max(80, "其他考试形式最多 80 字")),
    assignmentType: multiOptionSchema(assignmentTypeIds),
    attendanceRequired: optionalEnumSchema(attendanceIds, "出勤要求无效"),
    tags: z
      .preprocess(normalizeIdList, z.array(z.enum(tagIds)))
      .refine((items) => items.every((item) => tagValues.includes(item)), {
        message: "包含无效标签",
      })
      .refine((items) => findConflictingReviewTags(items) == null, {
        message: "不能同时选择意思相反的标签",
      }),
    reviewText: z.preprocess((value) => {
      if (typeof value !== "string") return "";
      return value.trim();
    }, z.string().max(8000, "课程体验最多 8000 字")),
    isAnonymous: z
      .preprocess(
        (value) => value === "on" || value === true || value === "true",
        z.boolean(),
      )
      .optional()
      .default(true),
  })
  .superRefine((data, ctx) => {
    if (
      data.examTypes.includes("other") &&
      data.examTypeOther.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["examTypeOther"],
        message: "请填写其他考试形式",
      });
    }
  })
  .transform((data) => ({
    ...data,
    examType: encodeExamTypeSelection(data.examTypes, data.examTypeOther),
  }));

export type CourseReviewFormValues = z.infer<typeof courseReviewSchema>;
