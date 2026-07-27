import { HomeCourseCard } from "@/components/home/HomeCourseCard";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";
import { ROUTES } from "@/constants/routes";
import { type HomeSectionResult } from "@/types/home";
import { type CourseWithStats } from "@/types/course";

type FeaturedCoursesSectionProps = {
  result: HomeSectionResult<CourseWithStats>;
};

export function FeaturedCoursesSection({ result }: FeaturedCoursesSectionProps) {
  return (
    <HomeSectionShell
      title="热门课程"
      description="按评价数量排序，快速了解同学最常讨论的课程。"
      href={ROUTES.courses.list}
    >
      {result.error ? (
        <HomeEmptyState
          error
          title="热门课程加载失败"
          description="请稍后刷新页面重试。"
        />
      ) : result.items.length === 0 ? (
        <HomeEmptyState
          title="暂无课程数据"
          description="导入课程 PDF 后，这里会展示最受关注的课程。"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((course) => (
            <HomeCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </HomeSectionShell>
  );
}
