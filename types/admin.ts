import { type AdminContentArticle } from "@/lib/db/contentCms";
import { type AdminGuideDetail } from "@/types/guide";
import { type CourseWithStats } from "@/types/course";
import {
  type AdminActionLogWithAdmin,
  type ReportWithReporter,
} from "@/types/report";
import { type ProfileListItem } from "@/types/user";
import { type UserRole, type UserStatus } from "@/constants/userRoles";

export type AdminStats = {
  userCount: number;
  pendingReportCount: number;
  postCount: number;
};

export type AdminUserListItem = ProfileListItem & {
  status: UserStatus;
  createdAt: string;
  polyuVerifiedAt: string | null;
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
};

export type AdminDashboardData = {
  stats: AdminStats;
  users: AdminUserListItem[];
  reports: ReportWithReporter[];
  forumPosts: AdminForumPostListItem[];
  forumComments: AdminForumCommentListItem[];
  courseReviews: AdminCourseReviewListItem[];
  courses: CourseWithStats[];
  guides: AdminGuideDetail[];
  studyArticles: AdminContentArticle[];
  lifeArticles: AdminContentArticle[];
  adminActions: AdminActionLogWithAdmin[];
  isDatabaseConfigured: boolean;
};
