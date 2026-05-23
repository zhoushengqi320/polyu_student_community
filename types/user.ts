import { type UserRole, type UserStatus } from "@/constants/userRoles";

export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  schoolId: string;
  polyuVerifiedAt: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionUser = {
  id: string;
  email: string | null;
  profile: Profile | null;
};

export type ProfileListItem = Pick<
  Profile,
  "id" | "username" | "displayName" | "avatarUrl" | "role"
>;
