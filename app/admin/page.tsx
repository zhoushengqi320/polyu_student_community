import { ModulePageShell } from "@/components/common/ModulePageShell";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminAccessState } from "@/lib/admin/session";
import {
  getAdminActions,
  getAdminStats,
  getAllForumComments,
  getAllForumPosts,
  listUsers,
} from "@/lib/db/admin";
import { getReports } from "@/lib/db/reports";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { type AdminDashboardData } from "@/types/admin";

const EMPTY_DASHBOARD: AdminDashboardData = {
  stats: { userCount: 0, pendingReportCount: 0, postCount: 0 },
  users: [],
  reports: [],
  forumPosts: [],
  forumComments: [],
  adminActions: [],
  isDatabaseConfigured: false,
};

export default async function AdminPage() {
  const { user, reason, isAdmin } = await getAdminAccessState();

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
      const [stats, users, reports, forumPosts, forumComments, adminActions] =
        await Promise.all([
          getAdminStats(),
          listUsers({ pageSize: 50 }),
          getReports({ pageSize: 100 }),
          getAllForumPosts({ pageSize: 100 }),
          getAllForumComments({ pageSize: 100 }),
          getAdminActions({ pageSize: 100 }),
        ]);

      dashboardData = {
        stats,
        users,
        reports,
        forumPosts,
        forumComments,
        adminActions,
        isDatabaseConfigured,
      };
    } catch (error) {
      console.error("Failed to load admin dashboard data:", error);
    }
  }

  return (
    <ModulePageShell
      title="管理后台"
      description="自由讨论区举报处理、内容管理与用户管理（仅管理员可见）"
    >
      {!isDatabaseConfigured ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          数据库尚未配置，部分数据无法加载。
        </div>
      ) : null}
      <AdminDashboard data={dashboardData} />
    </ModulePageShell>
  );
}
