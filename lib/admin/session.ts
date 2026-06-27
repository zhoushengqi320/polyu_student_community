import { USER_ROLES, USER_STATUS } from "@/constants/userRoles";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/utils/permissions";
import { type SessionUser } from "@/types/user";

export type AdminAccessBlockReason =
  | "allowed"
  | "not_logged_in"
  | "profile_missing"
  | "banned"
  | "not_admin";

export function getAdminAccessBlockReason(
  user: SessionUser | null,
): AdminAccessBlockReason {
  if (!user) {
    return "not_logged_in";
  }

  if (!user.profile) {
    return "profile_missing";
  }

  if (user.profile.status === USER_STATUS.banned) {
    return "banned";
  }

  if (user.profile.role !== USER_ROLES.admin) {
    return "not_admin";
  }

  return "allowed";
}

export async function getAdminAccessState(): Promise<{
  user: SessionUser | null;
  reason: AdminAccessBlockReason;
  isAdmin: boolean;
}> {
  const user = await getSessionUser();
  const reason = getAdminAccessBlockReason(user);

  return {
    user,
    reason,
    isAdmin: reason === "allowed" && can(user, "admin:access"),
  };
}

export async function requireAdmin(): Promise<SessionUser> {
  const { user, reason } = await getAdminAccessState();

  if (reason !== "allowed" || !user) {
    throw new Error("需要管理员权限");
  }

  return user;
}

export async function isAdminSession(): Promise<boolean> {
  const { isAdmin } = await getAdminAccessState();
  return isAdmin;
}
