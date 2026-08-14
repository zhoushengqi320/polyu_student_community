export const COURSE_RATING_DIMENSIONS = [
  {
    id: "overall",
    label: "总体推荐度",
    min: 1,
    max: 5,
    optionLabels: ["不推荐", "较差", "一般", "推荐", "强烈推荐"],
  },
  {
    id: "difficulty",
    label: "课程难度",
    min: 1,
    max: 5,
    optionLabels: ["很简单", "较简单", "中等", "较难", "很难"],
  },
  {
    id: "workload",
    label: "工作量",
    min: 1,
    max: 5,
    optionLabels: ["很轻松", "较轻松", "适中", "较繁重", "很繁重"],
  },
  {
    id: "grading",
    label: "给分友好度",
    min: 1,
    max: 5,
    optionLabels: ["很严", "偏严", "一般", "偏松", "很友好"],
  },
  {
    id: "teaching",
    label: "教学质量",
    min: 1,
    max: 5,
    optionLabels: ["很差", "较差", "一般", "较好", "很好"],
  },
  {
    id: "examDifficulty",
    label: "考试难度",
    min: 1,
    max: 5,
    optionLabels: ["很简单", "较简单", "中等", "较难", "很难"],
  },
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

/** 生成近几个学年选项，例如 2025/26 */
export function getRecentAcademicYears(count = 6): string[] {
  const now = new Date();
  // 8 月起视为新学年
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: count }, (_, index) => {
    const year = startYear - index;
    return `${year}/${String(year + 1).slice(-2)}`;
  });
}

export function buildCourseSemesterValue(
  academicYear: string,
  termId: CourseSemesterId,
): string {
  if (!academicYear || academicYear === "unknown") {
    return termId;
  }
  return `${academicYear}|${termId}`;
}

export function parseCourseSemester(value: string): {
  academicYear: string | null;
  termId: string;
} {
  if (value.includes("|")) {
    const [academicYear, termId] = value.split("|");
    return {
      academicYear: academicYear || null,
      termId: termId || "unknown",
    };
  }
  return { academicYear: null, termId: value || "unknown" };
}

export function formatCourseSemesterLabel(value: string): string {
  const { academicYear, termId } = parseCourseSemester(value);
  const termLabel =
    COURSE_SEMESTERS.find((item) => item.id === termId)?.label ?? termId;
  return academicYear ? `${academicYear} · ${termLabel}` : termLabel;
}

export function getCourseRatingDimension(id: CourseRatingDimensionId) {
  return COURSE_RATING_DIMENSIONS.find((item) => item.id === id)!;
}

export const COURSE_DEPARTMENTS = [
  { id: "aae", label: "航空及民航工程学系 (AAE)" },
  { id: "abct", label: "应用生物及化学科技学系 (ABCT)" },
  { id: "af", label: "会计及金融 (AF)" },
  { id: "ama", label: "应用数学 (AMA)" },
  { id: "apss", label: "应用社会科学 (APSS)" },
  { id: "ap", label: "应用物理 (AP)" },
  { id: "bme", label: "生物医学工程 (BME)" },
  { id: "cee", label: "土木及环境工程 (CEE)" },
  { id: "chc", label: "中文及双语学 (CHC)" },
  { id: "clc", label: "中国语文 (CLC)" },
  { id: "comp", label: "计算学系 (COMP)" },
  { id: "dsai", label: "数据科学及人工智能 (DSAI)" },
  { id: "eee", label: "电机工程 (EEE)" },
  { id: "engl", label: "英文 (ENGL)" },
  { id: "fb", label: "Food & Beverage (FB)" },
  { id: "fsn", label: "食品科学及营养 (FSN)" },
  { id: "lms", label: "物流管理 (LMS)" },
  { id: "lsgi", label: "土地测量及地理资讯学 (LSGI)" },
  { id: "me", label: "机械工程 (ME)" },
  { id: "mm", label: "管理及市场学 (MM)" },
  { id: "sft", label: "时装及纺织 (SFT)" },
  { id: "shtm", label: "酒店及旅游业管理 (SHTM)" },
  { id: "bba", label: "商学院 (其他)" },
  { id: "other", label: "其他" },
] as const;

export type CourseDepartmentId = (typeof COURSE_DEPARTMENTS)[number]["id"];

export function getDepartmentLabel(departmentId: string): string {
  const found = COURSE_DEPARTMENTS.find((item) => item.id === departmentId);
  if (found) {
    return found.label;
  }
  return departmentId.trim().toUpperCase();
}

/** 课程列表/卡片上展示的院系代码（大写） */
export function getDepartmentCode(departmentId: string): string {
  const id = departmentId.trim();
  if (!id) {
    return "";
  }
  const found = COURSE_DEPARTMENTS.find((item) => item.id === id.toLowerCase());
  if (found && found.id !== "other" && found.id !== "bba") {
    return found.id.toUpperCase();
  }
  if (found?.id === "bba") {
    return "BBA";
  }
  return id.toUpperCase();
}

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
  { id: "other", label: "其他" },
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

/** 互斥标签对：不能同时选中 */
export const COURSE_CONFLICTING_TAG_PAIRS: ReadonlyArray<
  readonly [CourseReviewTag, CourseReviewTag]
> = [
  ["给分好", "给分差"],
  ["作业多", "作业少"],
  ["考试简单", "考试困难"],
  ["老师讲得好", "老师讲得一般"],
  ["推荐选修", "不推荐"],
];

export function getConflictingReviewTag(
  tag: string,
): CourseReviewTag | undefined {
  for (const [left, right] of COURSE_CONFLICTING_TAG_PAIRS) {
    if (tag === left) return right;
    if (tag === right) return left;
  }
  return undefined;
}

export function findConflictingReviewTags(
  tags: readonly string[],
): [string, string] | null {
  const selected = new Set(tags);
  for (const [left, right] of COURSE_CONFLICTING_TAG_PAIRS) {
    if (selected.has(left) && selected.has(right)) {
      return [left, right];
    }
  }
  return null;
}

/** 多选项写入 TEXT 字段（逗号分隔） */
export function encodeMultiOptionIds(ids: readonly string[]): string | null {
  const unique = [...new Set(ids.map((item) => item.trim()).filter(Boolean))];
  return unique.length > 0 ? unique.join(",") : null;
}

export function decodeMultiOptionIds(value: string | null | undefined): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

const EXAM_OTHER_PREFIX = "other:";

/** 考试形式多选 + 「其他」自定义文案 */
export function encodeExamTypeSelection(
  ids: readonly string[],
  otherText: string,
): string | null {
  const selected = [...new Set(ids.map((item) => item.trim()).filter(Boolean))];
  const hasOther =
    selected.includes("other") || selected.includes("unknown");
  const base = selected.filter(
    (id) => id !== "other" && id !== "unknown" && !id.startsWith(EXAM_OTHER_PREFIX),
  );

  if (hasOther) {
    const custom = otherText.trim().replace(/,/g, "，").slice(0, 80);
    base.push(custom ? `${EXAM_OTHER_PREFIX}${custom}` : "other");
  }

  return encodeMultiOptionIds(base);
}

export function parseExamTypeSelection(value: string | null | undefined): {
  ids: string[];
  otherText: string;
} {
  const raw = decodeMultiOptionIds(value);
  let otherText = "";
  const ids: string[] = [];

  for (const item of raw) {
    if (item.startsWith(EXAM_OTHER_PREFIX)) {
      ids.push("other");
      otherText = item.slice(EXAM_OTHER_PREFIX.length);
      continue;
    }
    if (item === "other" || item === "unknown") {
      ids.push("other");
      continue;
    }
    ids.push(item);
  }

  return { ids: [...new Set(ids)], otherText };
}

export function labelsFromMultiOptions(
  value: string | null | undefined,
  options: ReadonlyArray<{ id: string; label: string }>,
): string[] {
  return decodeMultiOptionIds(value).map((id) => {
    if (id.startsWith(EXAM_OTHER_PREFIX)) {
      const custom = id.slice(EXAM_OTHER_PREFIX.length);
      return custom || "其他";
    }
    if (id === "other" || id === "unknown") {
      return options.find((item) => item.id === "other")?.label ?? "其他";
    }
    return options.find((item) => item.id === id)?.label ?? id;
  });
}
