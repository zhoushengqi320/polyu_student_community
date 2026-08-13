"use client";

import { useState } from "react";
import { Suspense } from "react";
import { ADMIN_TABS, type AdminTabId } from "@/constants/admin";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminActionsTable } from "@/components/admin/AdminActionsTable";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { ProfileReviewTable } from "@/components/admin/ProfileReviewTable";
import { ReportTable } from "@/components/admin/ReportTable";
import { ContentArchivePanel } from "@/components/admin/ContentArchivePanel";
import { CommunityContentTabs } from "@/components/admin/CommunityContentTabs";
import { CoursesAdminPanel } from "@/components/admin/courses/CoursesAdminPanel";
import { ContentCmsPanel } from "@/components/admin/content/ContentCmsPanel";
import { type AdminDashboardData } from "@/types/admin";
import { cn } from "@/lib/utils/cn";

type AdminDashboardProps = {
  data: AdminDashboardData;
  initialTab?: AdminTabId;
  initialEditCourseId?: string | null;
};

export function AdminDashboard({
  data,
  initialTab = "reports",
  initialEditCourseId = null,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab);
  const pendingAppeals = data.pendingArchiveAppeals ?? [];

  return (
    <div className="space-y-6">
      {!data.isDatabaseConfigured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          数据库尚未配置，统计数据与列表为空。请在 `.env.local` 中配置 Supabase 后刷新页面。
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b pb-1">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
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
            {tab.id === "archives" && pendingAppeals.length > 0 ? (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground">
                {pendingAppeals.length}
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

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <AdminStatsCards stats={data.stats} />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">快捷说明</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>在「资料审核」中优先处理高风险待审与中风险复核；低风险昵称/头像会自动公开。</li>
              <li>
                在「举报中心」：首次举报仅标注待审；第二名举报人触发自动隐藏并复制封存；确认违规会隐藏并封存（作者可申诉）；驳回会警告/失信标记，再次驳回则封禁 30 天。
              </li>
              <li>
                在「封存申诉」审核作者申诉（通过则恢复并删除封存；驳回则通知作者）。打开本页会自动处理逾期封存。
              </li>
              <li>在「社区内容」中可统一查看帖子、评论与课程评价（含已删除日志项）。</li>
              <li>在「课程目录」中可新增或编辑课程基础信息。</li>
              <li>在「内容管理」中可维护入学攻略、学习指南、生活指南（支持 Markdown 预览与图片上传）。</li>
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
          pendingAppeals={pendingAppeals}
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
          courseReviews={data.courseReviews}
        />
      ) : null}

      {activeTab === "courses" ? (
        <CoursesAdminPanel initialEditCourseId={initialEditCourseId} />
      ) : null}

      {activeTab === "guides" ? (
        <ContentCmsPanel
          guides={data.guides}
          studyArticles={data.studyArticles}
          lifeArticles={data.lifeArticles}
        />
      ) : null}

      {activeTab === "users" ? (
        <UserManagementTable users={data.users} />
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
