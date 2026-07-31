import Link from "next/link";
import { MessageSquare } from "lucide-react";
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
import { interactiveCardClassName } from "@/lib/utils/interactiveCard";
import { type CourseWithStats } from "@/types/course";

type HomeCourseCardProps = {
  course: CourseWithStats;
};

export function HomeCourseCard({ course }: HomeCourseCardProps) {
  return (
    <Card className={interactiveCardClassName("h-full")}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
            {course.code}
          </span>
          <span>{course.department}</span>
        </div>
        <CardTitle className="line-clamp-2 text-lg">
          <Link
            href={ROUTES.courses.detail(course.code)}
            className="transition-colors hover:text-primary"
          >
            {course.name}
          </Link>
        </CardTitle>
        {course.reviewCount > 0 ? (
          <CardDescription className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {course.reviewCount} 条评价
          </CardDescription>
        ) : (
          <CardDescription>暂无评价</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Overall</p>
            <RatingDisplay value={course.averageOverallRating} size="sm" />
          </div>
          <div>
            <p className="text-muted-foreground">Difficulty</p>
            <RatingDisplay value={course.averageDifficultyRating} size="sm" />
          </div>
        </div>
        {course.commonTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {course.commonTags.slice(0, 3).map((item) => (
              <TagBadge key={item.tag} label={item.tag} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
