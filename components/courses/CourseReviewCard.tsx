import { ReportDialog } from "@/components/common/ReportDialog";
import { DeleteContentButton } from "@/components/common/DeleteContentButton";
import { RatingDisplay } from "@/components/common/RatingDisplay";
import { CourseReviewHelpfulButton } from "@/components/courses/CourseReviewHelpfulButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  COURSE_ASSIGNMENT_TYPES,
  COURSE_EXAM_TYPES,
  formatCourseSemesterLabel,
  getAttendanceLabel,
  labelsFromMultiOptions,
} from "@/constants/courseOptions";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { deleteOwnCourseReviewAction } from "@/lib/course/actions";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type CourseReviewWithAuthor } from "@/types/course";

type CourseReviewCardProps = {
  review: CourseReviewWithAuthor;
  courseCode: string;
  isLoggedIn: boolean;
  canManage?: boolean;
  currentUserId?: string | null;
};

function labelFromOptions(
  value: string | null | undefined,
  options: ReadonlyArray<{ id: string; label: string }>,
) {
  if (!value) return null;
  return options.find((item) => item.id === value)?.label ?? value;
}

export function CourseReviewCard({
  review,
  courseCode,
  isLoggedIn,
  canManage = false,
  currentUserId,
}: CourseReviewCardProps) {
  const authorName = review.author.displayName ?? review.author.username;
  const examTypeLabels = labelsFromMultiOptions(review.examType, COURSE_EXAM_TYPES);
  const assignmentTypeLabels = labelsFromMultiOptions(
    review.assignmentType,
    COURSE_ASSIGNMENT_TYPES,
  );
  const attendanceLabel = getAttendanceLabel(review.attendanceRequired);

  const metaParts = [
    formatCourseSemesterLabel(review.semester),
    review.teacherName ? `教师：${review.teacherName}` : null,
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{authorName}</CardTitle>
            <CardDescription>
              {metaParts.length > 0 ? `${metaParts.join(" · ")} · ` : ""}
              {formatRelativeTime(review.createdAt)}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <CourseReviewHelpfulButton
              reviewId={review.id}
              usefulCount={review.usefulCount}
              isMarkedUseful={review.isMarkedUseful}
              revalidatePath={ROUTES.courses.detail(courseCode)}
              isLoggedIn={isLoggedIn}
            />
            {canManage ? (
              <DeleteContentButton
                action={deleteOwnCourseReviewAction.bind(
                  null,
                  review.id,
                  courseCode,
                )}
                title="确认删除评价？"
                description="删除后该评价将不再公开展示。"
              />
            ) : null}
            <ReportDialog
              targetType={TARGET_TYPES.course_review}
              targetId={review.id}
              isLoggedIn={isLoggedIn}
              ownerId={review.userId}
              currentUserId={currentUserId}
              revalidatePath={ROUTES.courses.detail(courseCode)}
              triggerSize="sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">总体推荐</p>
            <RatingDisplay value={review.overallRating} size="sm" />
          </div>
          <div>
            <p className="text-muted-foreground">难度</p>
            <RatingDisplay value={review.difficultyRating} size="sm" />
          </div>
          {review.workloadRating != null ? (
            <div>
              <p className="text-muted-foreground">工作量</p>
              <RatingDisplay value={review.workloadRating} size="sm" />
            </div>
          ) : null}
          {review.gradingRating != null ? (
            <div>
              <p className="text-muted-foreground">给分友好度</p>
              <RatingDisplay value={review.gradingRating} size="sm" />
            </div>
          ) : null}
          {review.teachingRating != null ? (
            <div>
              <p className="text-muted-foreground">教学质量</p>
              <RatingDisplay value={review.teachingRating} size="sm" />
            </div>
          ) : null}
          {review.examDifficulty != null ? (
            <div>
              <p className="text-muted-foreground">考试难度</p>
              <RatingDisplay value={review.examDifficulty} size="sm" />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {examTypeLabels.length > 0 ||
        assignmentTypeLabels.length > 0 ||
        attendanceLabel ? (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {examTypeLabels.length > 0 ? (
              <span className="rounded-md border px-2 py-1">
                考试：{examTypeLabels.join("、")}
              </span>
            ) : null}
            {assignmentTypeLabels.length > 0 ? (
              <span className="rounded-md border px-2 py-1">
                作业：{assignmentTypeLabels.join("、")}
              </span>
            ) : null}
            {attendanceLabel ? (
              <span className="rounded-md border px-2 py-1">
                出勤：{attendanceLabel}
              </span>
            ) : null}
          </div>
        ) : null}

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

        {review.reviewText ? (
          <p className="whitespace-pre-wrap text-sm leading-6">{review.reviewText}</p>
        ) : null}

        {review.tips && review.tips !== review.reviewText ? (
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">Tips</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{review.tips}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
