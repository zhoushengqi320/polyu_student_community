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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Stats</CardTitle>
        <CardDescription>基于学生课程评价自动聚合</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Overall Rating</p>
          <RatingDisplay value={course.averageOverallRating} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Difficulty</p>
          <RatingDisplay value={course.averageDifficultyRating} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Review Count</p>
          <p className="text-lg font-semibold">{course.reviewCount}</p>
        </div>
        {course.commonTags.length > 0 ? (
          <div className="sm:col-span-3">
            <p className="text-sm text-muted-foreground">Most Common Tags</p>
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
