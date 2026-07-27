import { getHomePageData } from "@/lib/db/home";
import { HeroSection } from "@/components/home/HeroSection";
import { CoreModuleGrid } from "@/components/home/CoreModuleGrid";
import { FeaturedCoursesSection } from "@/components/home/FeaturedCoursesSection";
import { LatestCourseReviewsSection } from "@/components/home/LatestCourseReviewsSection";
import { LatestForumPostsSection } from "@/components/home/LatestForumPostsSection";
import { FeaturedGuidesSection } from "@/components/home/FeaturedGuidesSection";
import { QuickResourcesSection } from "@/components/home/QuickResourcesSection";

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <div>
      <HeroSection />

      <div className="container space-y-12 py-12 md:space-y-16 md:py-16">
        {!data.isDatabaseConfigured ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            数据库尚未配置，动态内容区块将显示为空。请在 `.env.local` 中配置 Supabase 后刷新页面。
          </div>
        ) : null}

        <CoreModuleGrid />
        <FeaturedCoursesSection result={data.featuredCourses} />
        <LatestCourseReviewsSection result={data.latestReviews} />
        <LatestForumPostsSection result={data.latestPosts} />
        <FeaturedGuidesSection result={data.featuredGuides} />
        <QuickResourcesSection result={data.quickResources} />
      </div>
    </div>
  );
}
