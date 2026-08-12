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
}): ProfileRiskDecision {
  const hasContent = Boolean(input.nickname?.trim() || input.avatarUrl?.trim());
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

  if (risk.level === CONTENT_RISK_LEVELS.high) {
    return {
      level: risk.level,
      flags: risk.flags,
      autoApprove: false,
      needsAttention: true,
      reviewStatus: PROFILE_REVIEW_STATUS.pending,
    };
  }

  if (risk.level === CONTENT_RISK_LEVELS.medium) {
    return {
      level: risk.level,
      flags: risk.flags,
      autoApprove: true,
      needsAttention: true,
      reviewStatus: PROFILE_REVIEW_STATUS.approved,
    };
  }

  return {
    level: CONTENT_RISK_LEVELS.low,
    flags: risk.flags,
    autoApprove: true,
    needsAttention: false,
    reviewStatus: PROFILE_REVIEW_STATUS.approved,
  };
}

export function profileRiskUserMessage(decision: ProfileRiskDecision): string {
  if (decision.level === CONTENT_RISK_LEVELS.high) {
    return "资料已提交，因触发安全检测需管理员审核通过后才会公开展示。";
  }
  if (decision.level === CONTENT_RISK_LEVELS.medium) {
    return "资料已更新并公开展示，系统已标记为中风险供管理员复核。";
  }
  return "资料已更新并公开展示。";
}
