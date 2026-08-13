import { ModulePageShell } from "@/components/common/ModulePageShell";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminAccessState } from "@/lib/admin/session";
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
import { getAllGuidesForAdmin } from "@/lib/db/guides";
import { listContentArticlesForAdmin } from "@/lib/db/contentCms";
import { getReports } from "@/lib/db/reports";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type AdminDashboardData } from "@/types/admin";
import { resolveAdminTab } from "@/constants/admin";

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
  adminActions: [],
  contentArchives: [],
  pendingArchiveAppeals: [],
  expiredArchiveCount: 0,
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
  const { user, reason, isAdmin } = await getAdminAccessState();
  const params = await searchParams;
  const initialTab = resolveAdminTab(params.tab);
  const initialEditCourseId = params.editCourseId ?? null;
  const actionsQuery = params.q?.trim() || undefined;
  const actionsPage = Math.max(1, Number(params.page) || 1);
  const actionsPageSize = 20;

  if (!isAdmin) {
    return <AdminAccessDenied reason={reason} user={user} />;
  }

  const isDatabaseConfigured = isSupabaseConfigured();

  let dashboardData: AdminDashboardData = {
    ...EMPTY_DASHBOARD,
    isDatabaseConfigured,
  };

  if (isDatabaseConfigured) {
    try {
      // 加载后台时顺带清理逾期封存
      const expiredArchiveCount = await expireDueArchives();

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
        adminActionsResult,
        contentArchives,
        pendingArchiveAppeals,
      ] = await Promise.all([
        getAdminStats(),
        listUsers({ pageSize: 50 }),
        listPendingProfileReviews(100),
        getReports({ pageSize: 100 }),
        getAllForumPosts({ pageSize: 100 }),
        getAllForumComments({ pageSize: 100 }),
        getAllCourseReviews({ pageSize: 100 }),
        getAllGuidesForAdmin({ pageSize: 100 }),
        listContentArticlesForAdmin("study", { pageSize: 100 }),
        listContentArticlesForAdmin("life", { pageSize: 100 }),
        getAdminActions({
          page: actionsPage,
          pageSize: actionsPageSize,
          query: actionsQuery,
        }),
        listActiveContentArchives(100),
        listPendingArchiveAppeals(100),
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
        adminActions: adminActionsResult.items,
        adminActionsTotal: adminActionsResult.total,
        adminActionsPage: actionsPage,
        adminActionsPageSize: actionsPageSize,
        adminActionsQuery: actionsQuery ?? "",
        contentArchives,
        pendingArchiveAppeals,
        expiredArchiveCount,
        isDatabaseConfigured,
      };
    } catch (error) {
      console.error("Failed to load admin dashboard data:", error);
    }
  }

  return (
    <ModulePageShell
      title="管理后台"
      description="举报处理、内容管理与用户管理（仅管理员可见）"
    >
      {!isDatabaseConfigured ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          数据库尚未配置，部分数据无法加载。
        </div>
      ) : null}
      <AdminDashboard
        data={dashboardData}
        initialTab={initialTab}
        initialEditCourseId={initialEditCourseId}
      />
    </ModulePageShell>
  );
}
