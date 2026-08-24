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
import {
  listAnnouncementsForAdmin,
  syncAnnouncementLifecycle,
} from "@/lib/db/announcements";
import { getReports } from "@/lib/db/reports";
import { listMarketListingsForAdmin } from "@/lib/db/market";
import { listPendingMessageAppeals } from "@/lib/db/messages";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveAdminTab, type AdminTabId } from "@/constants/admin";
import { type AdminDashboardData } from "@/types/admin";

const EMPTY_DASHBOARD: AdminDashboardData = {
  stats: {
    userCount: 0,
    onlineUserCount: 0,
    pendingReportCount: 0,
    pendingProfileReviewCount: 0,
    pendingArchiveAppealCount: 0,
    pendingMessageAppealCount: 0,
    postCount: 0,
  },
  users: [],
  profileReviews: [],
  reports: [],
  forumPosts: [],
  forumComments: [],
  marketListings: [],
  courseReviews: [],
  courses: [],
  guides: [],
  studyArticles: [],
  lifeArticles: [],
  announcements: [],
  adminActions: [],
  contentArchives: [],
  pendingArchiveAppeals: [],
  pendingMessageAppeals: [],
  expiredArchiveCount: 0,
  emailWhitelist: [],
  isDatabaseConfigured: false,
};

async function loadTabData(
  tab: AdminTabId,
  options: {
    actionsQuery?: string;
    actionsPage: number;
    actionsPageSize: number;
  },
): Promise<Partial<AdminDashboardData>> {
  switch (tab) {
    case "overview":
      return {};
    case "reports": {
      const [reports, pendingMessageAppeals] = await Promise.all([
        getReports({ pageSize: 100 }),
        listPendingMessageAppeals(100),
      ]);
      return { reports, pendingMessageAppeals };
    }
    case "archives": {
      const expiredArchiveCount = await expireDueArchives();
      const [contentArchives, pendingArchiveAppeals] = await Promise.all([
        listActiveContentArchives(100),
        listPendingArchiveAppeals(100),
      ]);
      return { expiredArchiveCount, contentArchives, pendingArchiveAppeals };
    }
    case "profile-reviews":
      return { profileReviews: await listPendingProfileReviews(100) };
    case "content": {
      const [forumPosts, forumComments, marketListings] = await Promise.all([
        getAllForumPosts({ pageSize: 100 }),
        getAllForumComments({ pageSize: 100 }),
        listMarketListingsForAdmin(100),
      ]);
      return { forumPosts, forumComments, marketListings };
    }
    case "courses":
      return { courseReviews: await getAllCourseReviews({ pageSize: 100 }) };
    case "guides": {
      const [guides, studyArticles, lifeArticles] = await Promise.all([
        getAllGuidesForAdmin({ pageSize: 100 }),
        listContentArticlesForAdmin("study", { pageSize: 100 }),
        listContentArticlesForAdmin("life", { pageSize: 100 }),
      ]);
      return { guides, studyArticles, lifeArticles };
    }
    case "announcements": {
      await syncAnnouncementLifecycle();
      return { announcements: await listAnnouncementsForAdmin() };
    }
    case "users": {
      const [users, emailWhitelist] = await Promise.all([
        listUsers({ pageSize: 200 }),
        listEmailWhitelist(100),
      ]);
      return { users, emailWhitelist };
    }
    case "actions": {
      const adminActionsResult = await getAdminActions({
        page: options.actionsPage,
        pageSize: options.actionsPageSize,
        query: options.actionsQuery,
      });
      return {
        adminActions: adminActionsResult.items,
        adminActionsTotal: adminActionsResult.total,
        adminActionsPage: options.actionsPage,
        adminActionsPageSize: options.actionsPageSize,
        adminActionsQuery: options.actionsQuery ?? "",
      };
    }
    default:
      return {};
  }
}

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
  const params = await searchParams;
  const activeTab = resolveAdminTab(params.tab);
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
      // 概览也会触发逾期封存清理，避免只有打开「封存申诉」才执行
      const shouldExpireArchives =
        activeTab === "overview" || activeTab === "archives";

      const [stats, tabData, expiredOnOverview] = await Promise.all([
        getAdminStats(),
        loadTabData(activeTab, {
          actionsQuery,
          actionsPage,
          actionsPageSize,
        }),
        shouldExpireArchives && activeTab === "overview"
          ? expireDueArchives()
          : Promise.resolve(0),
      ]);

      dashboardData = {
        ...EMPTY_DASHBOARD,
        ...tabData,
        stats,
        expiredArchiveCount:
          tabData.expiredArchiveCount ?? expiredOnOverview ?? 0,
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
