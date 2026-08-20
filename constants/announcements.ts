export const ANNOUNCEMENT_CATEGORIES = {
  activity: "活动招募",
  maintenance: "系统维护",
  update: "功能更新",
  general: "平台通知",
} as const;

export type AnnouncementCategory =
  (typeof ANNOUNCEMENT_CATEGORIES)[keyof typeof ANNOUNCEMENT_CATEGORIES];

export const ANNOUNCEMENT_CATEGORY_IDS = Object.keys(
  ANNOUNCEMENT_CATEGORIES,
) as (keyof typeof ANNOUNCEMENT_CATEGORIES)[];

export const ANNOUNCEMENT_IMPORTANCE = {
  normal: "普通",
  important: "重要",
} as const;

export type AnnouncementImportance =
  (typeof ANNOUNCEMENT_IMPORTANCE)[keyof typeof ANNOUNCEMENT_IMPORTANCE];

export const ANNOUNCEMENT_IMPORTANCE_IDS = Object.keys(
  ANNOUNCEMENT_IMPORTANCE,
) as (keyof typeof ANNOUNCEMENT_IMPORTANCE)[];

/** 未填写展示结束时间时的默认展示时长（小时） */
export const ANNOUNCEMENT_DEFAULT_DURATION_HOURS = 24;

/** 首页公告栏最大可视高度（超出后纵向滚动） */
export const HOME_ANNOUNCEMENT_MAX_HEIGHT = "max-h-48";

export const ANNOUNCEMENT_STATUS = {
  scheduled: "scheduled",
  published: "published",
  hidden: "hidden",
  removed: "removed",
} as const;

export type AnnouncementStatus =
  (typeof ANNOUNCEMENT_STATUS)[keyof typeof ANNOUNCEMENT_STATUS];

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  scheduled: "预发布排队",
  published: "已发布",
  hidden: "已隐藏",
  removed: "已移除",
};

/** 兼容旧数据：将历史 variant 值映射为重要等级 */
export function normalizeAnnouncementImportance(value: string): keyof typeof ANNOUNCEMENT_IMPORTANCE {
  if (value === "important" || value === "warning") {
    return "important";
  }
  return "normal";
}
