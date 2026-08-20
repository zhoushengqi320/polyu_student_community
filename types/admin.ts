import { type AdminContentArticle } from "@/lib/db/contentCms";
import { type ContentArchiveRow } from "@/lib/db/contentArchives";
import { type AdminGuideDetail } from "@/types/guide";
import { type CourseWithStats } from "@/types/course";
import {
  type AdminActionLogWithAdmin,
  type ReportWithReporter,
} from "@/types/report";
import { type ProfileListItem } from "@/types/user";
import { type UserActivitySnapshot } from "@/types/userActivity";
import { type UserRole, type UserStatus } from "@/constants/userRoles";

export type AdminStats = {
  userCount: number;
  pendingReportCount: number;
  pendingProfileReviewCount: number;
  postCount: number;
};

export type AdminUserListItem = ProfileListItem & {
  email: string | null;
  status: UserStatus;
  bannedUntil: string | null;
  reporterWarningCount: number;
  createdAt: string;
  polyuVerifiedAt: string | null;
  lastSeenAt: string | null;
  profileReviewStatus: string;
  activity: UserActivitySnapshot | null;
};

export type AdminProfileReviewItem = {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  approvedNickname: string | null;
  approvedAvatarUrl: string | null;
  profileReviewStatus: "pending" | "approved" | "rejected";
  reviewReason: string | null;
  grade: string | null;
  major: string | null;
  updatedAt: string;
  riskLevel: "low" | "medium" | "high";
  riskFlags: string[];
  riskAttention: boolean;
};

export type AdminUserFilters = {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
};

export type AdminReportFilters = {
  status?: string;
  targetType?: string;
  page?: number;
  pageSize?: number;
};

export type AdminForumPostListItem = {
  id: string;
  title: string;
  categoryId: string | null;
  author: ProfileListItem;
  createdAt: string;
  deletedAt: string | null;
  status: string;
};

export type AdminForumCommentListItem = {
  id: string;
  content: string;
  author: ProfileListItem;
  postId: string;
  postTitle: string;
  createdAt: string;
  deletedAt: string | null;
  status: string;
};

export type AdminCourseReviewListItem = {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  author: ProfileListItem;
  overallRating: number;
  difficultyRating: number;
  tags: string[];
  reviewText: string;
  isAnonymous: boolean;
  createdAt: string;
  deletedAt: string | null;
  status: string;
};

export type AdminListFilters = {
  page?: number;
  pageSize?: number;
};

export type AdminActionFilters = {
  page?: number;
  pageSize?: number;
  query?: string;
};

export type AdminDashboardData = {
  stats: AdminStats;
  users: AdminUserListItem[];
  profileReviews: AdminProfileReviewItem[];
  reports: ReportWithReporter[];
  forumPosts: AdminForumPostListItem[];
  forumComments: AdminForumCommentListItem[];
  courseReviews: AdminCourseReviewListItem[];
  courses: CourseWithStats[];
  guides: AdminGuideDetail[];
  studyArticles: AdminContentArticle[];
  lifeArticles: AdminContentArticle[];
  announcements: import("@/types/announcement").AdminAnnouncement[];
  adminActions: AdminActionLogWithAdmin[];
  adminActionsTotal?: number;
  adminActionsPage?: number;
  adminActionsPageSize?: number;
  adminActionsQuery?: string;
  contentArchives?: ContentArchiveRow[];
  pendingArchiveAppeals?: ContentArchiveRow[];
  expiredArchiveCount?: number;
  emailWhitelist?: import("@/lib/db/emailWhitelist").EmailWhitelistRow[];
  isDatabaseConfigured: boolean;
};
