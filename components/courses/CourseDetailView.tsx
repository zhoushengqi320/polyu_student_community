import Link from "next/link";
import { CourseAssessment } from "@/components/courses/CourseAssessment";
import { CourseDetailTabs } from "@/components/courses/CourseDetailTabs";
import { CourseFavoriteButton } from "@/components/courses/CourseFavoriteButton";
import { CourseOverview } from "@/components/courses/CourseOverview";
import { CourseReviews } from "@/components/courses/CourseReviews";
import { CourseStatsCard } from "@/components/courses/CourseStatsCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDepartmentCode } from "@/constants/courseOptions";
import { ROUTES } from "@/constants/routes";
import {
  normalizeDisplayCode,
  normalizeDisplayName,
} from "@/lib/courses/normalizeDisplay";
import { getCourseReviewPrompt } from "@/lib/utils/authPrompts";
import { type SessionUser } from "@/types/user";
import { type CourseDetail } from "@/types/course";

type CourseDetailViewProps = {
  course: CourseDetail;
  user: SessionUser | null;
  isFavorited: boolean;
  currentUserId?: string | null;
  isAdminUser?: boolean;
};

export function CourseDetailView({
  course,
  user,
  isFavorited,
  currentUserId = null,
  isAdminUser = false,
}: CourseDetailViewProps) {
  const displayCode = normalizeDisplayCode(course.code);
  const displayName = normalizeDisplayName(course.name, course.code);
  const review = getCourseReviewPrompt(user, course.code);
  const isLoggedIn = Boolean(user);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
              {displayCode}
            </span>
            <span>{getDepartmentCode(course.department)}</span>
            {course.faculty ? <span>{course.faculty}</span> : null}
            {course.credits ? <span>{course.credits} 学分</span> : null}
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-2xl">{displayName}</CardTitle>
              <CardDescription className="mt-2">
                官方课程信息 + 学生真实评价
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <CourseFavoriteButton
                courseId={course.id}
                isFavorited={isFavorited}
                revalidatePath={ROUTES.courses.detail(course.code)}
                isLoggedIn={isLoggedIn}
              />
              <Button asChild>
                <Link href={review.href}>
                  {review.canReview ? "写课程评价" : review.label}
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <CourseStatsCard course={course} user={user} />

      <CourseDetailTabs
        tabs={[
          {
            id: "overview",
            label: "课程概览",
            content: <CourseOverview course={course} />,
          },
          {
            id: "assessment",
            label: "考核方式",
            content: <CourseAssessment course={course} />,
          },
          {
            id: "reviews",
            label: "学生评价",
            content: (
              <CourseReviews
                course={course}
                isLoggedIn={isLoggedIn}
                currentUserId={currentUserId}
                isAdminUser={isAdminUser}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
