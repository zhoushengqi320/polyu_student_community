export const FEATURES = {
  marketplace: false,
  housing: false,
  internships: false,
  gpaCalculator: false,
  coursePlanner: false,
  notifications: false,
  messaging: false,
  multiSchool: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
