import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { RatingDisplay } from "@/components/common/RatingDisplay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { type CourseDetail } from "@/types/course";

type CourseStatsCardProps = {
  course: CourseDetail;
  canReview: boolean;
};

function averageOf(
  values: Array<number | null | undefined>,
): number | null {
  const nums = values.filter((value): value is number => typeof value === "number");
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 10) / 10;
}

export function CourseStatsCard({ course, canReview }: CourseStatsCardProps) {
  if (course.reviewCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Stats</CardTitle>
          <CardDescription>暂无评价数据</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No reviews yet"
            description="成为第一个分享这门课真实体验的人。"
            action={
              <Button asChild>
                <Link
                  href={canReview ? ROUTES.courses.review(course.code) : ROUTES.login}
                >
                  {canReview ? "写第一条评价" : "登录后评价"}
                </Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const averageWorkload = averageOf(course.reviews.map((item) => item.workloadRating));
  const averageGrading = averageOf(course.reviews.map((item) => item.gradingRating));
  const averageTeaching = averageOf(course.reviews.map((item) => item.teachingRating));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Stats</CardTitle>
        <CardDescription>基于学生课程评价自动聚合</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">总体推荐</p>
          <RatingDisplay value={course.averageOverallRating} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">课程难度</p>
          <RatingDisplay value={course.averageDifficultyRating} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">评价数</p>
          <p className="text-lg font-semibold">{course.reviewCount}</p>
        </div>
        {averageWorkload != null ? (
          <div>
            <p className="text-sm text-muted-foreground">工作量</p>
            <RatingDisplay value={averageWorkload} />
          </div>
        ) : null}
        {averageGrading != null ? (
          <div>
            <p className="text-sm text-muted-foreground">给分友好度</p>
            <RatingDisplay value={averageGrading} />
          </div>
        ) : null}
        {averageTeaching != null ? (
          <div>
            <p className="text-sm text-muted-foreground">教学质量</p>
            <RatingDisplay value={averageTeaching} />
          </div>
        ) : null}
        {course.commonTags.length > 0 ? (
          <div className="sm:col-span-3">
            <p className="text-sm text-muted-foreground">常见标签</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {course.commonTags.map((item) => (
                <span
                  key={item.tag}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {item.tag} · {item.count}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
