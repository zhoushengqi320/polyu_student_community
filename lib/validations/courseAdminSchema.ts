import { z } from "zod";
import { COURSE_DEPARTMENTS } from "@/constants/courseOptions";

const departmentIds = COURSE_DEPARTMENTS.map((item) => item.id) as [
  string,
  ...string[],
];

function emptyToNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export const courseAdminSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "课程代码至少 2 个字符")
    .max(64, "课程代码最多 64 个字符")
    .transform((value) => value.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, "课程名称至少 2 个字符")
    .max(200, "课程名称最多 200 个字符"),
  department: z.enum(departmentIds, { message: "请选择院系" }),
  faculty: z.preprocess(emptyToNull, z.string().max(200).nullable()),
  level: z.preprocess(emptyToNull, z.string().max(20).nullable()),
  credits: z.preprocess((value) => {
    if (value === "" || value == null) return null;
    if (typeof value === "string") return Number(value);
    return value;
  }, z.number().min(0).max(30).nullable()),
  description: z.preprocess(emptyToNull, z.string().max(20000).nullable()),
  objectives: z.preprocess(emptyToNull, z.string().max(20000).nullable()),
  prerequisites: z.preprocess(emptyToNull, z.string().max(8000).nullable()),
  teachingPattern: z.preprocess(emptyToNull, z.string().max(8000).nullable()),
  semesterOffered: z.preprocess(emptyToNull, z.string().max(100).nullable()),
});

export type CourseAdminFormValues = z.infer<typeof courseAdminSchema>;
