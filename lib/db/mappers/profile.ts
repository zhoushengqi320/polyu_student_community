import { type UserRole } from "@/constants/userRoles";
import { type ProfileReviewStatus } from "@/constants/profileReview";
import {
  getPublicAvatarUrl,
  getPublicDisplayName,
} from "@/lib/profile/publicDisplay";
import { type Profile, type ProfileListItem } from "@/types/user";
import { type Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function mapProfile(row: ProfileRow): Profile {
  const reviewStatus = (row.profile_review_status ??
    "approved") as ProfileReviewStatus;
  const approvedNickname = row.approved_nickname ?? null;
  const approvedAvatarUrl = row.approved_avatar_url ?? null;

  const publicName = getPublicDisplayName({
    profileReviewStatus: reviewStatus,
    approvedNickname,
  });
  const publicAvatar = getPublicAvatarUrl({
    profileReviewStatus: reviewStatus,
    approvedAvatarUrl,
  });

  const isFirstSetup =
    row.is_first_setup_completed ?? row.onboarding_completed ?? false;

  return {
    id: row.id,
    username: row.username,
    displayName: publicName,
    avatarUrl: publicAvatar,
    nickname: row.nickname ?? null,
    approvedNickname,
    approvedAvatarUrl,
    pendingAvatarUrl: row.avatar_url ?? null,
    profileReviewStatus: reviewStatus,
    reviewReason: row.review_reason ?? null,
    role: row.role as UserRole,
    status: row.status,
    bannedUntil:
      (row as ProfileRow & { banned_until?: string | null }).banned_until ??
      null,
    reporterWarningCount:
      (row as ProfileRow & { reporter_warning_count?: number })
        .reporter_warning_count ?? 0,
    schoolId: row.school_id,
    polyuVerifiedAt: row.polyu_verified_at,
    bio: row.bio,
    grade: row.grade ?? null,
    major: row.major ?? null,
    onboardingCompleted: isFirstSetup,
    isFirstSetupCompleted: isFirstSetup,
    homeTourCompletedAt:
      (row as ProfileRow & { home_tour_completed_at?: string | null })
        .home_tour_completed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProfileListItem(row: ProfileRow): ProfileListItem {
  const profile = mapProfile(row);
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    role: profile.role,
  };
}

/** profiles join 为空时的安全占位，避免后台列表崩溃 */
export function mapProfileListItemOrFallback(
  row: ProfileRow | null | undefined,
  fallbackId = "unknown",
  fallbackName = "未知用户",
): ProfileListItem {
  if (row?.id) {
    return mapProfileListItem(row);
  }
  return {
    id: fallbackId,
    username: "unknown",
    displayName: fallbackName,
    avatarUrl: null,
    role: "user",
  };
}

export function toProfileListItem(profile: Profile): ProfileListItem {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    role: profile.role,
  };
}

export type { ProfileRow };
