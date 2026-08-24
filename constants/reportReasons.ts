export const REPORT_REASONS = [
  { id: "spam", label: "广告 / 垃圾内容" },
  { id: "scam", label: "诈骗" },
  { id: "academic_misconduct", label: "代写 / 作弊" },
  { id: "harassment", label: "骚扰 / 人身攻击" },
  { id: "hate_speech", label: "仇恨或歧视" },
  { id: "sexual_content", label: "色情内容" },
  { id: "false_information", label: "虚假信息" },
  { id: "political_sensitive", label: "政治敏感" },
  { id: "privacy", label: "隐私泄露" },
  { id: "other", label: "其他" },
] as const;

export type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];

/** @deprecated 兼容旧数据展示 */
export const LEGACY_REPORT_REASON_LABELS: Record<string, string> = {
  misinformation: "虚假信息",
  inappropriate: "不当内容",
};

export function getReportReasonLabel(reason: string): string {
  const found = REPORT_REASONS.find((item) => item.id === reason);
  if (found) {
    return found.label;
  }
  return LEGACY_REPORT_REASON_LABELS[reason] ?? reason;
}

export const REPORT_STATUS = {
  pending: "pending",
  reviewing: "reviewing",
  reviewed: "reviewed",
  resolved: "resolved",
  dismissed: "dismissed",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const TARGET_TYPES = {
  post: "post",
  comment: "comment",
  course: "course",
  course_review: "course_review",
  food_place: "food_place",
  food_recommendation: "food_recommendation",
  market_listing: "market_listing",
  buddy_post: "buddy_post",
  profile: "profile",
  message: "message",
} as const;

export type TargetType = (typeof TARGET_TYPES)[keyof typeof TARGET_TYPES];

/** 自由讨论区举报使用的 target_type（复用通用 post / comment） */
export const FORUM_REPORT_TARGET_TYPES = {
  post: TARGET_TYPES.post,
  comment: TARGET_TYPES.comment,
} as const;

export type ForumReportTargetType =
  (typeof FORUM_REPORT_TARGET_TYPES)[keyof typeof FORUM_REPORT_TARGET_TYPES];
