export const USER_ROLES = {
  guest: "guest",
  user: "user",
  verified_polyu_user: "verified_polyu_user",
  admin: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  guest: "访客",
  user: "用户",
  verified_polyu_user: "理大认证用户",
  admin: "管理员",
};

export const USER_STATUS = {
  active: "active",
  banned: "banned",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "正常",
  banned: "已封禁",
};
