export const REPORT_REASONS = [
  { id: "spam", label: "垃圾广告" },
  { id: "harassment", label: "骚扰辱骂" },
  { id: "misinformation", label: "虚假信息" },
  { id: "inappropriate", label: "不当内容" },
  { id: "privacy", label: "侵犯隐私" },
  { id: "other", label: "其他" },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];

export const REPORT_STATUS = {
  pending: "pending",
  reviewing: "reviewing",
  resolved: "resolved",
  dismissed: "dismissed",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const TARGET_TYPES = {
  post: "post",
  comment: "comment",
  course_review: "course_review",
  food_recommendation: "food_recommendation",
  buddy_post: "buddy_post",
  profile: "profile",
} as const;

export type TargetType = (typeof TARGET_TYPES)[keyof typeof TARGET_TYPES];
