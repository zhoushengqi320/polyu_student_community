import { ReportDialog } from "@/components/common/ReportDialog";
import { RatingDisplay } from "@/components/common/RatingDisplay";
import { CourseReviewHelpfulButton } from "@/components/courses/CourseReviewHelpfulButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type CourseReviewWithAuthor } from "@/types/course";

type CourseReviewCardProps = {
  review: CourseReviewWithAuthor;
  courseCode: string;
  isLoggedIn: boolean;
};

export function CourseReviewCard({
  review,
  courseCode,
  isLoggedIn,
}: CourseReviewCardProps) {
  const authorName = review.author.displayName ?? review.author.username;

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{authorName}</CardTitle>
            <CardDescription>
              {formatRelativeTime(review.createdAt)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <CourseReviewHelpfulButton
              reviewId={review.id}
              usefulCount={review.usefulCount}
              isMarkedUseful={review.isMarkedUseful}
              revalidatePath={ROUTES.courses.detail(courseCode)}
            />
            <ReportDialog
              targetType={TARGET_TYPES.course_review}
              targetId={review.id}
              isLoggedIn={isLoggedIn}
              revalidatePath={ROUTES.courses.detail(courseCode)}
              triggerSize="sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Overall</p>
            <RatingDisplay value={review.overallRating} size="sm" />
          </div>
          <div>
            <p className="text-muted-foreground">Difficulty</p>
            <RatingDisplay value={review.difficultyRating} size="sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {review.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <p className="whitespace-pre-wrap text-sm leading-6">{review.reviewText}</p>
      </CardContent>
    </Card>
  );
}
