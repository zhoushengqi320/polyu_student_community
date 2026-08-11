export const PROFILE_REVIEW_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export type ProfileReviewStatus =
  (typeof PROFILE_REVIEW_STATUS)[keyof typeof PROFILE_REVIEW_STATUS];

export const PROFILE_REVIEW_STATUS_LABELS: Record<ProfileReviewStatus, string> =
  {
    pending: "待审核",
    approved: "已通过",
    rejected: "已驳回",
  };
