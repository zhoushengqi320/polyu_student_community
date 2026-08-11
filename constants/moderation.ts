export const CONTENT_RISK_LEVELS = {
  low: "low",
  medium: "medium",
  high: "high",
} as const;

export type ContentRiskLevel =
  (typeof CONTENT_RISK_LEVELS)[keyof typeof CONTENT_RISK_LEVELS];

export const CONTENT_RISK_LABELS: Record<ContentRiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

/** 累计不同举报人达到此数量时自动临时下架 */
export const REPORT_AUTO_HIDE_THRESHOLD = 2;

export const NOTIFICATION_TYPES = {
  reportReceived: "report_received",
  contentAutoHidden: "content_auto_hidden",
  contentRemoved: "content_removed",
  contentRestored: "content_restored",
  reportResolved: "report_resolved",
  reportDismissed: "report_dismissed",
  reporterWarning: "reporter_warning",
  reporterBanned: "reporter_banned",
  contentPendingReview: "content_pending_review",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** 恶意举报：第二次起临时封禁天数 */
export const FALSE_REPORT_BAN_DAYS = 30;
