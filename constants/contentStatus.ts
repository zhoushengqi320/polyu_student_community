export const CONTENT_STATUS = {
  draft: "draft",
  published: "published",
  hidden: "hidden",
  removed: "removed",
} as const;

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "草稿",
  published: "已发布",
  hidden: "已隐藏",
  removed: "已移除",
};
