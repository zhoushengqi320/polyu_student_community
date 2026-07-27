import Link from "next/link";
import { RatingDisplay } from "@/components/common/RatingDisplay";
import { TagBadge } from "@/components/common/TagBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type HomeLatestCourseReview } from "@/types/home";

type HomeCourseReviewCardProps = {
  review: HomeLatestCourseReview;
};

export function HomeCourseReviewCard({ review }: HomeCourseReviewCardProps) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <CardDescription>{formatRelativeTime(review.createdAt)}</CardDescription>
        <CardTitle className="line-clamp-2 text-base">
          <Link
            href={ROUTES.courses.detail(review.courseCode)}
            className="hover:text-primary"
          >
            {review.courseCode} · {review.courseName}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        {review.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {review.tags.slice(0, 4).map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
