"use client";

import { Star } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { AdminContentPreviewDialog } from "@/components/admin/AdminContentPreviewDialog";
import { ADMIN_TABLE, adminTruncateCell } from "@/components/admin/adminTableClasses";
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
    <div className={ADMIN_TABLE.wrap}>
      <table className="w-full min-w-[1180px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className={ADMIN_TABLE.headCell}>课程</th>
            <th className={ADMIN_TABLE.headCell}>评价内容</th>
            <th className={ADMIN_TABLE.headCell}>作者</th>
            <th className={ADMIN_TABLE.headCell}>评分</th>
            <th className={ADMIN_TABLE.headCell}>标签</th>
            <th className={ADMIN_TABLE.headCell}>状态</th>
            <th className={ADMIN_TABLE.headCell}>时间</th>
            <th className={`${ADMIN_TABLE.headCell} text-right`}>操作</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => {
            const isDeleted = Boolean(review.deletedAt);
            const authorName = review.isAnonymous
              ? `匿名（${review.author.displayName ?? review.author.username}）`
              : review.author.displayName ?? review.author.username;

            return (
              <tr key={review.id} className={ADMIN_TABLE.row}>
                <td className={adminTruncateCell("max-w-[200px]")}>
                  <span
                    className="inline-flex max-w-full items-center gap-2"
                    title={`${review.courseCode} ${review.courseName}`}
                  >
                    <span className={isDeleted ? "text-muted-foreground" : undefined}>
                      <span className="font-medium">{review.courseCode}</span>
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        {review.courseName}
                      </span>
                      {isDeleted ? "（已删除）" : ""}
                    </span>
                    {!isDeleted ? (
                      <AdminContentPreviewDialog
                        targetType={TARGET_TYPES.course_review}
                        targetId={review.id}
                      />
                    ) : null}
                  </span>
                </td>
                <td className={adminTruncateCell("max-w-[240px]")}>
                  <span title={review.reviewText}>{review.reviewText}</span>
                </td>
                <td className={adminTruncateCell("max-w-[140px]")}>
                  <span title={authorName}>{authorName}</span>
                </td>
                <td className={ADMIN_TABLE.cell}>
                  <span className="inline-flex items-center gap-2">
                    <RatingDisplay value={review.overallRating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      难度 {review.difficultyRating}
                    </span>
                  </span>
                </td>
                <td className={adminTruncateCell("max-w-[200px]")}>
                  {review.tags.length > 0 ? (
                    <span className="text-xs" title={review.tags.join(" · ")}>
                      {review.tags.join(" · ")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className={ADMIN_TABLE.cell}>
                  {isDeleted ? (
                    <TagBadge label="Deleted" className="bg-destructive/10 text-destructive" />
                  ) : review.status === "hidden" ? (
                    <TagBadge label="Hidden" className="bg-amber-100 text-amber-800" />
                  ) : (
                    <TagBadge label="正常" />
                  )}
                </td>
                <td className={`${ADMIN_TABLE.cell} text-muted-foreground`}>
                  {formatDateTime(review.createdAt)}
                </td>
                <td className={ADMIN_TABLE.cellRight}>
                  {!isDeleted ? (
                    <AdminConfirmButton
                      label="删除评价"
                      confirmTitle="确认删除课程评价？"
                      confirmDescription="此操作将软删除该课程评价，前台将不再显示。相关举报将自动标记为已处理。"
                      action={adminDeleteCourseReviewAction}
                      hiddenFields={{ reviewId: review.id }}
                      requireReason
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
