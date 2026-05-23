import { z } from "zod";
import { COURSE_SEMESTERS } from "@/constants/courseOptions";

const semesterIds = COURSE_SEMESTERS.map((item) => item.id) as [
  string,
  ...string[],
];

export const courseReviewSchema = z.object({
  courseId: z.string().uuid(),
  semester: z.enum(semesterIds),
  overallRating: z.number().min(1).max(5),
  difficultyRating: z.number().min(1).max(5),
  workloadRating: z.number().min(1).max(5),
  gradingRating: z.number().min(1).max(5),
  teachingRating: z.number().min(1).max(5),
  content: z.string().min(10, "评价内容至少 10 个字").max(2000),
});

export type CourseReviewFormValues = z.infer<typeof courseReviewSchema>;
