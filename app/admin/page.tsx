import { AdminDashboard } from "@/components/admin/AdminDashboard";
import {
  getAdminActions,
  getAdminStats,
  getAllCourseReviews,
  getAllForumComments,
  getAllForumPosts,
  listPendingProfileReviews,
  listUsers,
} from "@/lib/db/admin";
import {
  expireDueArchives,
  listActiveContentArchives,
  listPendingArchiveAppeals,
} from "@/lib/db/contentArchives";
import { listEmailWhitelist } from "@/lib/db/emailWhitelist";
import { getAllGuidesForAdmin } from "@/lib/db/guides";
import { listContentArticlesForAdmin } from "@/lib/db/contentCms";
import { listAnnouncementsForAdmin, publishDueAnnouncements } from "@/lib/db/announcements";
import { getReports } from "@/lib/db/reports";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type AdminDashboardData } from "@/types/admin";

const EMPTY_DASHBOARD: AdminDashboardData = {
  stats: {
    userCount: 0,
    pendingReportCount: 0,
    pendingProfileReviewCount: 0,
    postCount: 0,
  },
  users: [],
  profileReviews: [],
  reports: [],
  forumPosts: [],
  forumComments: [],
  courseReviews: [],
  courses: [],
  guides: [],
  studyArticles: [],
  lifeArticles: [],
  announcements: [],
  adminActions: [],
  contentArchives: [],
  pendingArchiveAppeals: [],
  expiredArchiveCount: 0,
  emailWhitelist: [],
  isDatabaseConfigured: false,
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    editCourseId?: string;
    q?: string;
    page?: string;
  }>;
}) {
  // 鉴权已在 app/admin/layout.tsx 完成；此处仅加载后台数据。
  const params = await searchParams;
  const initialEditCourseId = params.editCourseId ?? null;
  const actionsQuery = params.q?.trim() || undefined;
  const actionsPage = Math.max(1, Number(params.page) || 1);
  const actionsPageSize = 20;

  const isDatabaseConfigured = isSupabaseConfigured();

  let dashboardData: AdminDashboardData = {
    ...EMPTY_DASHBOARD,
    isDatabaseConfigured,
  };

  if (isDatabaseConfigured) {
    try {
      const expiredArchiveCount = await expireDueArchives();
      await publishDueAnnouncements();

      const [
        stats,
        users,
        profileReviews,
        reports,
        forumPosts,
        forumComments,
        courseReviews,
        guides,
        studyArticles,
        lifeArticles,
        announcements,
        adminActionsResult,
        contentArchives,
        pendingArchiveAppeals,
        emailWhitelist,
      ] = await Promise.all([
        getAdminStats(),
        listUsers({ pageSize: 200 }),
        listPendingProfileReviews(100),
        getReports({ pageSize: 100 }),
        getAllForumPosts({ pageSize: 100 }),
        getAllForumComments({ pageSize: 100 }),
        getAllCourseReviews({ pageSize: 100 }),
        getAllGuidesForAdmin({ pageSize: 100 }),
        listContentArticlesForAdmin("study", { pageSize: 100 }),
        listContentArticlesForAdmin("life", { pageSize: 100 }),
        listAnnouncementsForAdmin(),
        getAdminActions({
          page: actionsPage,
          pageSize: actionsPageSize,
          query: actionsQuery,
        }),
        listActiveContentArchives(100),
        listPendingArchiveAppeals(100),
        listEmailWhitelist(100),
      ]);

      dashboardData = {
        stats,
        users,
        profileReviews,
        reports,
        forumPosts,
        forumComments,
        courseReviews,
        courses: [],
        guides,
        studyArticles,
        lifeArticles,
        announcements,
        adminActions: adminActionsResult.items,
        adminActionsTotal: adminActionsResult.total,
        adminActionsPage: actionsPage,
        adminActionsPageSize: actionsPageSize,
        adminActionsQuery: actionsQuery ?? "",
        contentArchives,
        pendingArchiveAppeals,
        expiredArchiveCount,
        emailWhitelist,
        isDatabaseConfigured,
      };
    } catch (error) {
      console.error("Failed to load admin dashboard data:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">管理后台</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          仅管理员可访问；此区域与前台站点完全隔离。
        </p>
      </div>
      {!isDatabaseConfigured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          数据库尚未配置，部分数据无法加载。
        </div>
      ) : null}
      <AdminDashboard
        data={dashboardData}
        initialEditCourseId={initialEditCourseId}
      />
    </div>
  );
}
