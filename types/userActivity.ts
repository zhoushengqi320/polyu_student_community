import { type UserActivityTier } from "@/constants/userActivity";

export type UserActivityBreakdown = {
  visit: number;
  creation: number;
  interaction: number;
  quality: number;
  penalty: number;
};

export type UserActivitySnapshot = {
  score: number;
  tier: UserActivityTier;
  tierLabel: string;
  lastActiveAt: string | null;
  breakdown: UserActivityBreakdown;
};
