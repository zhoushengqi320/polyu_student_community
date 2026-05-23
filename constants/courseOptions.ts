export const COURSE_RATING_DIMENSIONS = [
  { id: "overall", label: "综合评分", min: 1, max: 5 },
  { id: "difficulty", label: "课程难度", min: 1, max: 5 },
  { id: "workload", label: "作业量", min: 1, max: 5 },
  { id: "grading", label: "给分情况", min: 1, max: 5 },
  { id: "teaching", label: "教学质量", min: 1, max: 5 },
] as const;

export type CourseRatingDimensionId =
  (typeof COURSE_RATING_DIMENSIONS)[number]["id"];

export const COURSE_SEMESTERS = [
  { id: "sem1", label: "第一学期" },
  { id: "sem2", label: "第二学期" },
  { id: "summer", label: "暑期" },
  { id: "year", label: "全年" },
] as const;

export type CourseSemesterId = (typeof COURSE_SEMESTERS)[number]["id"];

export const COURSE_DEPARTMENTS = [
  { id: "comp", label: "计算学系" },
  { id: "eee", label: "电机工程系" },
  { id: "bba", label: "商学院" },
  { id: "other", label: "其他" },
] as const;

export type CourseDepartmentId = (typeof COURSE_DEPARTMENTS)[number]["id"];
