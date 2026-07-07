export const COURSE_RATING_DIMENSIONS = [
  { id: "overall", label: "综合评分", min: 1, max: 5 },
  { id: "difficulty", label: "课程难度", min: 1, max: 5 },
] as const;

export type CourseRatingDimensionId =
  (typeof COURSE_RATING_DIMENSIONS)[number]["id"];

export const COURSE_SEMESTERS = [
  { id: "sem1", label: "第一学期" },
  { id: "sem2", label: "第二学期" },
  { id: "summer", label: "暑期" },
  { id: "year", label: "全年" },
  { id: "unknown", label: "不确定 / 其他" },
] as const;

export type CourseSemesterId = (typeof COURSE_SEMESTERS)[number]["id"];

export const COURSE_DEPARTMENTS = [
  { id: "aae", label: "航空及民航工程学系" },
  { id: "comp", label: "计算学系" },
  { id: "dsai", label: "数据科学及人工智能学系" },
  { id: "eee", label: "电机工程系" },
  { id: "bba", label: "商学院" },
  { id: "other", label: "其他" },
] as const;

export type CourseDepartmentId = (typeof COURSE_DEPARTMENTS)[number]["id"];

export const COURSE_SORT_OPTIONS = [
  { id: "code", label: "课程代码" },
  { id: "rating", label: "综合评分" },
  { id: "difficulty", label: "课程难度" },
  { id: "review_count", label: "评价数" },
  { id: "latest", label: "最新收录" },
] as const;

export type CourseSortId = (typeof COURSE_SORT_OPTIONS)[number]["id"];

export const COURSE_EXAM_TYPES = [
  { id: "final_exam", label: "Final Exam" },
  { id: "midterm", label: "Midterm" },
  { id: "quiz", label: "Quiz / Test" },
  { id: "project", label: "Project-based" },
  { id: "presentation", label: "Presentation" },
  { id: "mixed", label: "Mixed" },
  { id: "none", label: "No Exam" },
  { id: "unknown", label: "不确定 / 其他" },
] as const;

export type CourseExamTypeId = (typeof COURSE_EXAM_TYPES)[number]["id"];

export const COURSE_ASSIGNMENT_TYPES = [
  { id: "individual", label: "Individual Assignment" },
  { id: "group", label: "Group Project" },
  { id: "lab", label: "Lab / Tutorial Work" },
  { id: "essay", label: "Essay / Report" },
  { id: "coding", label: "Coding Assignment" },
  { id: "mixed", label: "Mixed" },
  { id: "none", label: "No Major Assignment" },
  { id: "unknown", label: "不确定 / 其他" },
] as const;

export type CourseAssignmentTypeId =
  (typeof COURSE_ASSIGNMENT_TYPES)[number]["id"];

export const COURSE_ATTENDANCE_OPTIONS = [
  { id: "required", label: "强制出勤" },
  { id: "recommended", label: "建议出勤" },
  { id: "not_required", label: "不强制" },
  { id: "unknown", label: "不确定" },
] as const;

export type CourseAttendanceId =
  (typeof COURSE_ATTENDANCE_OPTIONS)[number]["id"];

export const COURSE_REVIEW_TAGS = [
  "给分好",
  "给分差",
  "作业多",
  "作业少",
  "考试简单",
  "考试困难",
  "老师讲得好",
  "老师讲得一般",
  "适合刷 GPA",
  "适合学知识",
  "Project 多",
  "Presentation 多",
  "推荐选修",
  "不推荐",
] as const;

export type CourseReviewTag = (typeof COURSE_REVIEW_TAGS)[number];

export const COURSE_MAX_REVIEW_TAGS = 6;
