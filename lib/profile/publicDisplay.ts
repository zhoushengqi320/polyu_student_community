import {
  DEFAULT_AVATAR_URL,
  DEFAULT_DISPLAY_NAME,
} from "@/constants/auth";
import { PROFILE_REVIEW_STATUS } from "@/constants/profileReview";

export type PublicProfileFields = {
  profileReviewStatus?: string | null;
  approvedNickname?: string | null;
  approvedAvatarUrl?: string | null;
  /** 兼容旧字段；公开展示不应直接使用 */
  displayName?: string | null;
  avatarUrl?: string | null;
};

/** 全站公开昵称：仅审核通过且有 approved_nickname 时展示真实昵称 */
export function getPublicDisplayName(profile: PublicProfileFields | null | undefined): string {
  if (!profile) {
    return DEFAULT_DISPLAY_NAME;
  }

  if (
    profile.profileReviewStatus === PROFILE_REVIEW_STATUS.approved &&
    profile.approvedNickname?.trim()
  ) {
    return profile.approvedNickname.trim();
  }

  return DEFAULT_DISPLAY_NAME;
}

/** 全站公开头像：仅审核通过且有 approved_avatar_url 时展示真实头像 */
export function getPublicAvatarUrl(profile: PublicProfileFields | null | undefined): string {
  if (!profile) {
    return DEFAULT_AVATAR_URL;
  }

  if (
    profile.profileReviewStatus === PROFILE_REVIEW_STATUS.approved &&
    profile.approvedAvatarUrl?.trim()
  ) {
    return profile.approvedAvatarUrl.trim();
  }

  return DEFAULT_AVATAR_URL;
}
