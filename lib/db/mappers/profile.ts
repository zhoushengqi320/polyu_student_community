import { type UserRole } from "@/constants/userRoles";
import { type Profile, type ProfileListItem } from "@/types/user";
import { type Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role as UserRole,
    status: row.status,
    schoolId: row.school_id,
    polyuVerifiedAt: row.polyu_verified_at,
    bio: row.bio,
    grade: row.grade ?? null,
    major: row.major ?? null,
    onboardingCompleted: row.onboarding_completed ?? true,
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
