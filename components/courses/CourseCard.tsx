import Link from "next/link";
import { BookOpen, MessageSquare } from "lucide-react";
import { RatingDisplay } from "@/components/common/RatingDisplay";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDepartmentCode } from "@/constants/courseOptions";
import { ROUTES } from "@/constants/routes";
import { getCourseReviewPrompt } from "@/lib/utils/authPrompts";
import { type SessionUser } from "@/types/user";
import { type CourseWithStats } from "@/types/course";

type CourseCardProps = {
  course: CourseWithStats;
  user: SessionUser | null;
};

export function CourseCard({ course, user }: CourseCardProps) {
  const review = getCourseReviewPrompt(user, course.code);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
            {course.code}
          </span>
          <span>{getDepartmentCode(course.department)}</span>
          {course.credits ? <span>{course.credits} 学分</span> : null}
        </div>
        <div className="space-y-2">
          <CardTitle className="line-clamp-2 text-lg">
            <Link
              href={ROUTES.courses.detail(course.code)}
              className="hover:text-primary"
            >
              {course.name}
            </Link>
          </CardTitle>
          {course.description ? (
            <CardDescription className="line-clamp-2">
              {course.description}
            </CardDescription>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">总体推荐</p>
            <RatingDisplay value={course.averageOverallRating} size="sm" />
          </div>
          <div>
            <p className="text-muted-foreground">课程难度</p>
            <RatingDisplay value={course.averageDifficultyRating} size="sm" />
          </div>
          <div className="flex items-end gap-1 text-muted-foreground">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>{course.reviewCount} 条评价</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={ROUTES.courses.detail(course.code)}>
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              查看详情
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={review.href}>{review.canReview ? "写评价" : review.label}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
