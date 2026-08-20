import { mapProfile, mapProfileListItem } from "@/lib/db/mappers/profile";
import { type AdminUserListItem } from "@/types/admin";
import { type Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function mapAdminUserListItem(
  row: ProfileRow,
  email: string | null = null,
  activity: AdminUserListItem["activity"] = null,
): AdminUserListItem {
  const profile = mapProfile(row);
  const extended = row as ProfileRow & {
    last_seen_at?: string | null;
    profile_review_status?: string | null;
  };

  return {
    ...mapProfileListItem(row),
    email,
    status: profile.status,
    bannedUntil: profile.bannedUntil,
    reporterWarningCount: profile.reporterWarningCount,
    createdAt: profile.createdAt,
    polyuVerifiedAt: profile.polyuVerifiedAt,
    lastSeenAt: extended.last_seen_at ?? null,
    profileReviewStatus: extended.profile_review_status ?? "approved",
    activity,
  };
}
