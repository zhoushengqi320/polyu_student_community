import { type UserRole, type UserStatus } from "@/constants/userRoles";
import { type ProfileReviewStatus } from "@/constants/profileReview";

export type Profile = {
  id: string;
  username: string;
  /** 公开展示名（已按审核规则解析） */
  displayName: string | null;
  /** 公开展示头像（已按审核规则解析） */
  avatarUrl: string | null;
  nickname: string | null;
  approvedNickname: string | null;
  approvedAvatarUrl: string | null;
  /** 用户提交的待审头像（仅本人资料页展示） */
  pendingAvatarUrl: string | null;
  profileReviewStatus: ProfileReviewStatus;
  reviewReason: string | null;
  role: UserRole;
  status: UserStatus;
  /** 临时封禁截止时间（恶意举报等） */
  bannedUntil: string | null;
  /** 恶意举报警告次数（管理员可见） */
  reporterWarningCount: number;
  schoolId: string;
  polyuVerifiedAt: string | null;
  bio: string | null;
  grade: string | null;
  major: string | null;
  onboardingCompleted: boolean;
  isFirstSetupCompleted: boolean;
  /** 首页新手引导完成时间；null 表示尚未完成 */
  homeTourCompletedAt: string | null;
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
