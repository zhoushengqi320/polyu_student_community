import { CONTENT_RISK_LEVELS, type ContentRiskLevel } from "@/constants/moderation";
import { PROFILE_REVIEW_STATUS } from "@/constants/profileReview";
import { assessProfileSubmissionRisk } from "@/lib/moderation/profileRisk";

export type ProfileRiskDecision = {
  level: ContentRiskLevel;
  flags: string[];
  /** 是否可立即公开展示本次提交 */
  autoApprove: boolean;
  /** 是否进入后台资料审核/关注队列 */
  needsAttention: boolean;
  reviewStatus: (typeof PROFILE_REVIEW_STATUS)[keyof typeof PROFILE_REVIEW_STATUS];
};

export function decideProfileSubmissionRisk(input: {
  nickname?: string | null;
  avatarUrl?: string | null;
  major?: string | null;
}): ProfileRiskDecision {
  const hasContent = Boolean(
    input.nickname?.trim() || input.avatarUrl?.trim() || input.major?.trim(),
  );
  if (!hasContent) {
    return {
      level: CONTENT_RISK_LEVELS.low,
      flags: [],
      autoApprove: true,
      needsAttention: false,
      reviewStatus: PROFILE_REVIEW_STATUS.approved,
    };
  }

  const risk = assessProfileSubmissionRisk(input);

  // 前台立即公开展示；中高风险仅进入后台复核队列，不阻断用户
  return {
    level: risk.level,
    flags: risk.flags,
    autoApprove: true,
    needsAttention: risk.level !== CONTENT_RISK_LEVELS.low,
    reviewStatus: PROFILE_REVIEW_STATUS.approved,
  };
}

/** @deprecated 前台不再展示审核相关提示 */
export function profileRiskUserMessage(): string {
  return "资料已更新";
}
