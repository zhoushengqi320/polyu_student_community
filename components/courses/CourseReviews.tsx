import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";
import { CourseReviewCard } from "@/components/courses/CourseReviewCard";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { type CourseDetail } from "@/types/course";

type CourseReviewsProps = {
  course: CourseDetail;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  isAdminUser?: boolean;
};

export function CourseReviews({
  course,
  isLoggedIn,
  currentUserId = null,
  isAdminUser = false,
}: CourseReviewsProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Reviews</h2>
          <p className="text-sm text-muted-foreground">来自学生的真实修读体验</p>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.courses.review(course.code)}>写评价</Link>
        </Button>
      </div>
      {course.reviews.length > 0 ? (
        <div className="space-y-3">
          {course.reviews.map((review) => (
            <CourseReviewCard
              key={review.id}
              review={review}
              courseCode={course.code}
              isLoggedIn={isLoggedIn}
              canManage={
                Boolean(currentUserId && currentUserId === review.userId) ||
                isAdminUser
              }
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无课程评价"
          description="成为第一个分享这门课真实体验的人。"
        />
      )}
    </section>
  );
}
