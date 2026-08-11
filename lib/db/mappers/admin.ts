import { mapProfile, mapProfileListItem } from "@/lib/db/mappers/profile";
import { type AdminUserListItem } from "@/types/admin";
import { type Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function mapAdminUserListItem(
  row: ProfileRow,
  email: string | null = null,
): AdminUserListItem {
  const profile = mapProfile(row);
  return {
    ...mapProfileListItem(row),
    email,
    status: profile.status,
    createdAt: profile.createdAt,
    polyuVerifiedAt: profile.polyuVerifiedAt,
  };
}
