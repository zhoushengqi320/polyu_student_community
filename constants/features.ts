export const FEATURES = {
  marketplace: false,
  housing: false,
  internships: false,
  gpaCalculator: false,
  coursePlanner: false,
  notifications: false,
  messaging: false,
  multiSchool: false,
  /** 开学季临时展示「入学攻略」；关闭后导航与首页不再常驻该入口 */
  seasonalGuides: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
