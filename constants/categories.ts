export const FORUM_CATEGORIES = [
  { id: "general", label: "综合讨论" },
  { id: "study", label: "学习交流" },
  { id: "campus", label: "校园生活" },
  { id: "career", label: "升学就业" },
  { id: "help", label: "求助问答" },
] as const;

export type ForumCategoryId = (typeof FORUM_CATEGORIES)[number]["id"];

export const BUDDY_ACTIVITY_TYPES = [
  { id: "study", label: "学习" },
  { id: "sport", label: "运动" },
  { id: "food", label: "约饭" },
  { id: "travel", label: "出行" },
  { id: "project", label: "项目合作" },
  { id: "other", label: "其他" },
] as const;

export type BuddyActivityTypeId = (typeof BUDDY_ACTIVITY_TYPES)[number]["id"];

export const FOOD_AREAS = [
  { id: "campus", label: "校内" },
  { id: "hung_hom", label: "红磡" },
  { id: "tst", label: "尖沙咀" },
  { id: "mong_kok", label: "旺角" },
  { id: "other", label: "其他" },
] as const;

export type FoodAreaId = (typeof FOOD_AREAS)[number]["id"];

export const RESOURCE_CATEGORIES = [
  { id: "official", label: "官方系统" },
  { id: "academic", label: "学术资源" },
  { id: "tools", label: "实用工具" },
  { id: "career", label: "升学就业" },
  { id: "life", label: "生活服务" },
] as const;

export type ResourceCategoryId = (typeof RESOURCE_CATEGORIES)[number]["id"];

export const GUIDE_STAGES = [
  { id: "pre_admission", label: "录取前" },
  { id: "registration", label: "注册入学" },
  { id: "first_year", label: "大一适应" },
  { id: "daily_life", label: "日常生活" },
] as const;

export type GuideStageId = (typeof GUIDE_STAGES)[number]["id"];

export const SCHOOLS = [
  { id: "polyu", label: "香港理工大学", shortLabel: "理大" },
] as const;

export type SchoolId = (typeof SCHOOLS)[number]["id"];

export const DEFAULT_SCHOOL_ID: SchoolId = "polyu";
