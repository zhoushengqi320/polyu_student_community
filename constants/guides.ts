export const GUIDE_MODULE = "guides" as const;

export const GUIDE_CATEGORIES = [
  { id: "admission", label: "申请入学" },
  { id: "pre_arrival", label: "行前准备" },
  { id: "first_week", label: "到港第一周" },
  { id: "course_registration", label: "选课流程" },
  { id: "campus_systems", label: "校园系统" },
  { id: "housing", label: "宿舍 / 租房" },
  { id: "banking_mobile", label: "银行卡 / 电话卡" },
  { id: "life_adaptation", label: "生活适应" },
] as const;

export type GuideCategoryId = (typeof GUIDE_CATEGORIES)[number]["id"];

export function getGuideCategoryLabel(category: string | null): string {
  const found = GUIDE_CATEGORIES.find((item) => item.id === category);
  return found?.label ?? "未分类";
}
