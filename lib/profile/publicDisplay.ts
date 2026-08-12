import {
  DEFAULT_AVATAR_URL,
  DEFAULT_DISPLAY_NAME,
} from "@/constants/auth";

export type PublicProfileFields = {
  profileReviewStatus?: string | null;
  approvedNickname?: string | null;
  approvedAvatarUrl?: string | null;
  /** 兼容旧字段；公开展示不应直接使用 */
  displayName?: string | null;
  avatarUrl?: string | null;
};

/** 全站公开昵称：优先展示已通过审核的昵称（新提交待审时仍保留旧昵称） */
export function getPublicDisplayName(profile: PublicProfileFields | null | undefined): string {
  if (!profile) {
    return DEFAULT_DISPLAY_NAME;
  }

  if (profile.approvedNickname?.trim()) {
    return profile.approvedNickname.trim();
  }

  return DEFAULT_DISPLAY_NAME;
}

/** 全站公开头像：优先展示已通过审核的头像（新提交待审时仍保留旧头像） */
export function getPublicAvatarUrl(profile: PublicProfileFields | null | undefined): string {
  if (!profile) {
    return DEFAULT_AVATAR_URL;
  }

  if (profile.approvedAvatarUrl?.trim()) {
    return profile.approvedAvatarUrl.trim();
  }

  return DEFAULT_AVATAR_URL;
}
