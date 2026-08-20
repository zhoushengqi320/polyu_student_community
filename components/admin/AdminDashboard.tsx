"use client";

import { Suspense, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import {
  ADMIN_TABS,
  resolveAdminTab,
  type AdminTabId,
} from "@/constants/admin";
import { ROUTES } from "@/constants/routes";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminActionsTable } from "@/components/admin/AdminActionsTable";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { ProfileReviewTable } from "@/components/admin/ProfileReviewTable";
import { ReportTable } from "@/components/admin/ReportTable";
import { ContentArchivePanel } from "@/components/admin/ContentArchivePanel";
import { CommunityContentTabs } from "@/components/admin/CommunityContentTabs";
import { CoursesAdminPanel } from "@/components/admin/courses/CoursesAdminPanel";
import { ContentCmsPanel } from "@/components/admin/content/ContentCmsPanel";
import { AnnouncementPanel } from "@/components/admin/announcements/AnnouncementPanel";
import { type AdminDashboardData } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type AdminDashboardProps = {
  data: AdminDashboardData;
  initialEditCourseId?: string | null;
};

function buildAdminUrl(tab: AdminTabId, params: URLSearchParams): string {
  const next = new URLSearchParams(params.toString());

  if (tab === "overview") {
    next.delete("tab");
  } else {
    next.set("tab", tab);
  }

  if (tab !== "actions") {
    next.delete("q");
    next.delete("page");
  }

  if (tab !== "courses") {
    next.delete("editCourseId");
  }

  const query = next.toString();
  return query ? `${ROUTES.admin}?${query}` : ROUTES.admin;
}

function AdminDashboardContent({
  data,
  initialEditCourseId = null,
}: AdminDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, startRefresh] = useTransition();
  const activeTab = resolveAdminTab(searchParams.get("tab"));
  const pendingAppealCount = data.stats.pendingArchiveAppealCount ?? 0;

  function selectTab(tab: AdminTabId) {
    router.replace(buildAdminUrl(tab, searchParams));
  }

  function handleRefresh() {
    startRefresh(() => {
      router.replace(ROUTES.admin);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {!data.isDatabaseConfigured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          数据库尚未配置，统计数据与列表为空。请在 `.env.local` 中配置 Supabase 后刷新页面。
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 border-b pb-1">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.id === "reports" && data.stats.pendingReportCount > 0 ? (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
                  {data.stats.pendingReportCount}
                </span>
              ) : null}
              {tab.id === "archives" && pendingAppealCount > 0 ? (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
                  {pendingAppealCount}
                </span>
              ) : null}
              {tab.id === "profile-reviews" &&
              data.stats.pendingProfileReviewCount > 0 ? (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
                  {data.stats.pendingProfileReviewCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          onClick={handleRefresh}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "刷新中…" : "刷新数据"}
        </Button>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <AdminStatsCards stats={data.stats} />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">快捷说明</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>在「资料审核」中按用户复核昵称与头像；前台已即时展示，驳回时将重置并通知用户。</li>
              <li>
                在「举报中心」：首次举报仅标注待审；第二名举报人触发自动隐藏并复制封存；确认违规会隐藏并封存（作者可申诉）；驳回会警告/失信标记，再次驳回则封禁 30 天。
              </li>
              <li>
                在「封存申诉」审核作者申诉（通过则恢复并删除封存；驳回则通知作者）。打开概览或封存页会自动处理逾期封存。
              </li>
              <li>在「社区内容」中可统一查看帖子与评论（含已删除日志项）。</li>
              <li>在「课程目录」中可维护课程信息，并切换查看课程评价。</li>
              <li>在「内容管理」中可维护入学攻略、学习指南、生活指南（支持 Markdown 预览与图片上传）。</li>
              <li>在「用户管理」可添加非理大邮箱白名单：对方注册跳过验证码，成功后名额作废但保留记录；白名单用户仅密码登录。</li>
              <li>所有管理操作会写入操作记录；逾期永久删除的完整备份在操作记录 metadata 中可查看。</li>
            </ul>
          </section>
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <ReportTable reports={data.reports} />
      ) : null}

      {activeTab === "archives" ? (
        <ContentArchivePanel
          archives={data.contentArchives ?? []}
          pendingAppeals={data.pendingArchiveAppeals ?? []}
          expiredCount={data.expiredArchiveCount ?? 0}
        />
      ) : null}

      {activeTab === "profile-reviews" ? (
        <ProfileReviewTable items={data.profileReviews} />
      ) : null}

      {activeTab === "content" ? (
        <CommunityContentTabs
          forumPosts={data.forumPosts}
          forumComments={data.forumComments}
        />
      ) : null}

      {activeTab === "courses" ? (
        <CoursesAdminPanel
          initialEditCourseId={initialEditCourseId}
          courseReviews={data.courseReviews}
        />
      ) : null}

      {activeTab === "guides" ? (
        <ContentCmsPanel
          guides={data.guides}
          studyArticles={data.studyArticles}
          lifeArticles={data.lifeArticles}
        />
      ) : null}

      {activeTab === "announcements" ? (
        <AnnouncementPanel announcements={data.announcements ?? []} />
      ) : null}

      {activeTab === "users" ? (
        <UserManagementTable
          users={data.users}
          whitelistEntries={data.emailWhitelist ?? []}
        />
      ) : null}

      {activeTab === "actions" ? (
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">加载操作记录…</p>
          }
        >
          <AdminActionsTable
            actions={data.adminActions}
            page={data.adminActionsPage ?? 1}
            pageSize={data.adminActionsPageSize ?? 20}
            total={data.adminActionsTotal ?? data.adminActions.length}
            query={data.adminActionsQuery ?? ""}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

export function AdminDashboard(props: AdminDashboardProps) {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">加载管理后台…</p>
      }
    >
      <AdminDashboardContent {...props} />
    </Suspense>
  );
}
