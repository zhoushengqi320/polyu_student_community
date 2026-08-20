import { getHomePageData } from "@/lib/db/home";
import { getSessionUser } from "@/lib/auth/session";
import { shouldShowHomeTour } from "@/lib/auth/homeTour";
import { HeroSection } from "@/components/home/HeroSection";
import { CoreModuleGrid } from "@/components/home/CoreModuleGrid";
import { LatestForumPostsSection } from "@/components/home/LatestForumPostsSection";
import { HomeValueSection } from "@/components/home/HomeValueSection";
import { HomeProductTour } from "@/components/home/HomeProductTour";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [data, user] = await Promise.all([getHomePageData(), getSessionUser()]);
  const showHomeTour = shouldShowHomeTour(user?.profile ?? null);

  return (
    <div>
      <HeroSection announcements={data.announcements} />

      <div
        id="home-content"
        className="container space-y-12 py-10 md:space-y-14 md:py-12"
      >
        {!data.isDatabaseConfigured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            数据库尚未配置，动态内容区块将显示为空。请在 `.env.local` 中配置 Supabase 后刷新页面。
          </div>
        ) : null}

        <HomeValueSection />
        <CoreModuleGrid />
        <LatestForumPostsSection result={data.latestPosts} />
      </div>

      <HomeProductTour enabled={showHomeTour} />
    </div>
  );
}
