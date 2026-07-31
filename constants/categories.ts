export const FOOD_AREAS = [
  { id: "campus", label: "校内" },
  { id: "hung_hom", label: "红磡" },
  { id: "tst", label: "尖沙咀" },
  { id: "mong_kok", label: "旺角" },
  { id: "other", label: "其他" },
] as const;

export type FoodAreaId = (typeof FOOD_AREAS)[number]["id"];

export const STUDY_GUIDE_TOPICS = [
  { id: "official_links", label: "常用官网" },
  { id: "course_strategy", label: "选课策略" },
  { id: "add_drop", label: "Add & Drop" },
  { id: "gpa", label: "GPA 规则" },
  { id: "exams", label: "考试安排" },
  { id: "academic_integrity", label: "学术规范" },
] as const;

export type StudyGuideTopicId = (typeof STUDY_GUIDE_TOPICS)[number]["id"];

export const LIFE_GUIDE_TOPICS = [
  { id: "sim_card", label: "电话卡" },
  { id: "banking", label: "银行开户" },
  { id: "octopus", label: "八达通" },
  { id: "shopping", label: "商超采购" },
  { id: "delivery", label: "快递外卖" },
  { id: "healthcare", label: "基础医疗" },
  { id: "utilities", label: "水电煤气" },
  { id: "transport", label: "交通出行" },
  { id: "local_rules", label: "本地生活规则" },
] as const;

export type LifeGuideTopicId = (typeof LIFE_GUIDE_TOPICS)[number]["id"];

export const SCHOOLS = [
  { id: "polyu", label: "香港理工大学", shortLabel: "理大" },
] as const;

export type SchoolId = (typeof SCHOOLS)[number]["id"];

export const DEFAULT_SCHOOL_ID: SchoolId = "polyu";
