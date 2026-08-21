import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AdminUserBar } from "@/components/admin/AdminUserBar";
import { getAdminAccessState } from "@/lib/admin/session";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "管理后台",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

/**
 * 后台独立壳：不挂载前台 Navbar/Footer。
 * 未登录跳转登录；已登录但非管理员返回 404，避免暴露后台存在与账号细节。
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getAdminAccessState();

  if (!user) {
    redirect(`${ROUTES.login}?next=${encodeURIComponent(ROUTES.admin)}`);
  }

  if (!isAdmin) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Suspense
        fallback={
          <header className="sticky top-0 z-50 border-b bg-background py-3">
            <div className="container text-sm font-semibold">
              PolyUHub 管理后台
            </div>
          </header>
        }
      >
        <AdminUserBar user={user} />
      </Suspense>
      <main className="flex-1">
        <div className="container py-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
