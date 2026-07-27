import { HomeCourseReviewCard } from "@/components/home/HomeCourseReviewCard";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";
import { ROUTES } from "@/constants/routes";
import { type HomeLatestCourseReview, type HomeSectionResult } from "@/types/home";

type LatestCourseReviewsSectionProps = {
  result: HomeSectionResult<HomeLatestCourseReview>;
};

export function LatestCourseReviewsSection({
  result,
}: LatestCourseReviewsSectionProps) {
  return (
    <HomeSectionShell
      title="最新课程评价"
      description="看看同学最近分享了哪些课程体验。"
      href={ROUTES.courses.list}
      linkLabel="浏览全部课程"
    >
      {result.error ? (
        <HomeEmptyState
          error
          title="最新评价加载失败"
          description="请稍后刷新页面重试。"
        />
      ) : result.items.length === 0 ? (
        <HomeEmptyState
          title="还没有课程评价"
          description="成为第一个分享课程体验的同学吧。"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((review) => (
            <HomeCourseReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </HomeSectionShell>
  );
}
