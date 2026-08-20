export const USER_ACTIVITY_TIERS = {
  silent: "silent",
  low: "low",
  normal: "normal",
  active: "active",
  high: "high",
} as const;

export type UserActivityTier =
  (typeof USER_ACTIVITY_TIERS)[keyof typeof USER_ACTIVITY_TIERS];

export const USER_ACTIVITY_TIER_LABELS: Record<UserActivityTier, string> = {
  silent: "静默",
  low: "低活跃",
  normal: "一般",
  active: "活跃",
  high: "高活跃",
};

/** 低于此分数在后台标灰（僵尸/几乎不用） */
export const USER_ACTIVITY_SILENT_THRESHOLD = 20;

export const USER_ACTIVITY_WEIGHTS = {
  visit: 0.25,
  creation: 0.45,
  interaction: 0.2,
  quality: 0.1,
} as const;

export const USER_ACTIVITY_CREATION_POINTS = {
  forumPost: 8,
  comment: 3,
  courseReview: 12,
  foodRecommendation: 6,
  guidePost: 10,
} as const;

export const USER_ACTIVITY_INTERACTION_POINTS = {
  like: 0.5,
  favorite: 1,
} as const;

export const USER_ACTIVITY_DAILY_CAPS = {
  forumPost: 3,
  comment: 10,
  courseReview: 2,
  foodRecommendation: 2,
  guidePost: 1,
  like: 20,
  favorite: 10,
} as const;

export const USER_ACTIVITY_SCORE_CAPS = {
  creationRaw: 40,
  interactionRaw: 15,
} as const;

export const USER_ACTIVITY_PENALTIES = {
  perReportWarning: 5,
  perRemovedContent: 8,
  maxRemovedContentPenalty: 24,
  bannedScoreCap: 10,
} as const;

export function resolveUserActivityTier(score: number): UserActivityTier {
  if (score < 20) {
    return USER_ACTIVITY_TIERS.silent;
  }
  if (score < 40) {
    return USER_ACTIVITY_TIERS.low;
  }
  if (score < 60) {
    return USER_ACTIVITY_TIERS.normal;
  }
  if (score < 80) {
    return USER_ACTIVITY_TIERS.active;
  }
  return USER_ACTIVITY_TIERS.high;
}
