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
    profileReviewStatus: reviewStatus,
    reviewReason: row.review_reason ?? null,
    role: row.role as UserRole,
    status: row.status,
    schoolId: row.school_id,
    polyuVerifiedAt: row.polyu_verified_at,
    bio: row.bio,
    grade: row.grade ?? null,
    major: row.major ?? null,
    onboardingCompleted: isFirstSetup,
    isFirstSetupCompleted: isFirstSetup,
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
