"use client";

import { Star } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { AdminContentPreviewDialog } from "@/components/admin/AdminContentPreviewDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { RatingDisplay } from "@/components/common/RatingDisplay";
import { TagBadge } from "@/components/common/TagBadge";
import { adminDeleteCourseReviewAction } from "@/lib/admin/actions";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type AdminCourseReviewListItem } from "@/types/admin";

type CourseReviewsTableProps = {
  reviews: AdminCourseReviewListItem[];
};

export function CourseReviewsTable({ reviews }: CourseReviewsTableProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="暂无课程评价"
        description="目前还没有学生提交课程评价。"
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 font-medium">课程</th>
            <th className="px-4 py-3 font-medium">评价内容</th>
            <th className="px-4 py-3 font-medium">作者</th>
            <th className="px-4 py-3 font-medium">评分</th>
            <th className="px-4 py-3 font-medium">标签</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">时间</th>
            <th className="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => {
            const isDeleted = Boolean(review.deletedAt);
            const authorName = review.isAnonymous
              ? `匿名（${review.author.displayName ?? review.author.username}）`
              : review.author.displayName ?? review.author.username;

            return (
              <tr key={review.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  {isDeleted ? (
                    <>
                      <span className="font-medium text-muted-foreground">
                        {review.courseCode}
                      </span>
                      <p className="line-clamp-1 max-w-[180px] text-xs text-muted-foreground">
                        {review.courseName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        已删除（仅日志）
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{review.courseCode}</span>
                      <p className="line-clamp-1 max-w-[180px] text-xs text-muted-foreground">
                        {review.courseName}
                      </p>
                      <AdminContentPreviewDialog
                        targetType={TARGET_TYPES.course_review}
                        targetId={review.id}
                      />
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="line-clamp-2 max-w-xs">{review.reviewText}</p>
                </td>
                <td className="px-4 py-3">{authorName}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <RatingDisplay value={review.overallRating} size="sm" />
                    <p className="text-xs text-muted-foreground">
                      Difficulty {review.difficultyRating}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {review.tags.length > 0 ? (
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                      {review.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {isDeleted ? (
                    <TagBadge label="Deleted" className="bg-destructive/10 text-destructive" />
                  ) : review.status === "hidden" ? (
                    <TagBadge label="Hidden" className="bg-amber-100 text-amber-800" />
                  ) : (
                    <TagBadge label="正常" />
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(review.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {!isDeleted ? (
                    <AdminConfirmButton
                      label="删除评价"
                      confirmTitle="确认删除课程评价？"
                      confirmDescription="此操作将软删除该课程评价，前台将不再显示。相关举报将自动标记为已处理。"
                      action={adminDeleteCourseReviewAction}
                      hiddenFields={{ reviewId: review.id }}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">已删除</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
