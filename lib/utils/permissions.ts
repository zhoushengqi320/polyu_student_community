import { MODULE_REGISTRY } from "@/constants/modules";
import { USER_ROLES, USER_STATUS } from "@/constants/userRoles";
import { type ModuleKey } from "@/types/common";
import { type SessionUser } from "@/types/user";

export type Permission =
  | "content:view"
  | "interaction:like"
  | "interaction:favorite"
  | "interaction:comment"
  | "content:create:forum"
  | "content:create:guide"
  | "content:create:study"
  | "content:create:life"
  | "content:create:course_review"
  | "content:create:food"
  | "admin:access"
  | "admin:manage_users"
  | "admin:manage_content";

const ROLE_PERMISSIONS: Record<
  ReturnType<typeof getEffectiveRole>,
  Permission[]
> = {
  guest: ["content:view"],
  user: [
    "content:view",
    "interaction:like",
    "interaction:favorite",
    "interaction:comment",
    "content:create:food",
  ],
  verified_polyu_user: [
    "content:view",
    "interaction:like",
    "interaction:favorite",
    "interaction:comment",
    "content:create:food",
    "content:create:forum",
    "content:create:guide",
    "content:create:study",
    "content:create:life",
    "content:create:course_review",
  ],
  admin: [
    "content:view",
    "interaction:like",
    "interaction:favorite",
    "interaction:comment",
    "content:create:food",
    "content:create:forum",
    "content:create:guide",
    "content:create:study",
    "content:create:life",
    "content:create:course_review",
    "admin:access",
    "admin:manage_users",
    "admin:manage_content",
  ],
  banned: ["content:view"],
};

const MODULE_CREATE_PERMISSION: Partial<Record<ModuleKey, Permission>> = {
  courses: "content:create:course_review",
  guides: "content:create:guide",
  study: "content:create:study",
  life: "content:create:life",
  food: "content:create:food",
  forum: "content:create:forum",
};

export function getEffectiveRole(user: SessionUser | null) {
  if (!user?.profile) {
    return USER_ROLES.guest;
  }

  if (user.profile.status === USER_STATUS.banned) {
    return "banned" as const;
  }

  return user.profile.role;
}

export function can(user: SessionUser | null, permission: Permission): boolean {
  const role = getEffectiveRole(user);
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertCan(
  user: SessionUser | null,
  permission: Permission,
): void {
  if (!can(user, permission)) {
    throw new Error("没有操作权限");
  }
}

export function canAccessModule(
  user: SessionUser | null,
  moduleKey: ModuleKey,
): boolean {
  if (!can(user, "content:view")) {
    return false;
  }

  const moduleConfig = MODULE_REGISTRY[moduleKey];
  if (!moduleConfig.requiresVerification) {
    return true;
  }

  const createPermission = MODULE_CREATE_PERMISSION[moduleKey];
  if (!createPermission) {
    return true;
  }

  return can(user, createPermission) || can(user, "admin:access");
}

export function canCreateInModule(
  user: SessionUser | null,
  moduleKey: ModuleKey,
): boolean {
  const permission = MODULE_CREATE_PERMISSION[moduleKey];
  if (!permission) {
    return false;
  }

  return can(user, permission);
}

export function canAccessAdmin(user: SessionUser | null): boolean {
  if (!user?.profile) {
    return false;
  }

  return (
    user.profile.role === USER_ROLES.admin &&
    user.profile.status === USER_STATUS.active &&
    can(user, "admin:access")
  );
}

export function isAdmin(user: SessionUser | null): boolean {
  return canAccessAdmin(user);
}

export function canManageOwnContent(
  user: SessionUser | null,
  ownerId: string,
): boolean {
  return Boolean(user && (user.id === ownerId || isAdmin(user)));
}

export function isBanned(user: SessionUser | null): boolean {
  return getEffectiveRole(user) === "banned";
}
