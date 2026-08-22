"use client";

import { MessageSquare } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { AdminContentPreviewDialog } from "@/components/admin/AdminContentPreviewDialog";
import { ADMIN_TABLE, adminTruncateCell } from "@/components/admin/adminTableClasses";
import { adminDeleteForumCommentAction } from "@/lib/admin/actions";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type AdminForumCommentListItem } from "@/types/admin";

type ForumCommentsTableProps = {
  comments: AdminForumCommentListItem[];
};

export function ForumCommentsTable({ comments }: ForumCommentsTableProps) {
  if (comments.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="暂无评论"
        description="自由讨论区还没有评论。"
      />
    );
  }

  return (
    <div className={ADMIN_TABLE.wrap}>
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className={ADMIN_TABLE.headCell}>评论内容</th>
            <th className={ADMIN_TABLE.headCell}>所属帖子</th>
            <th className={ADMIN_TABLE.headCell}>作者</th>
            <th className={ADMIN_TABLE.headCell}>状态</th>
            <th className={ADMIN_TABLE.headCell}>时间</th>
            <th className={`${ADMIN_TABLE.headCell} text-right`}>操作</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => {
            const isDeleted = Boolean(comment.deletedAt);

            return (
              <tr key={comment.id} className={ADMIN_TABLE.row}>
                <td className={adminTruncateCell("max-w-[280px]")}>
                  <span title={comment.content}>{comment.content}</span>
                </td>
                <td className={adminTruncateCell("max-w-[220px]")}>
                  <span className="inline-flex max-w-full items-center gap-2">
                    <span title={comment.postTitle}>
                      {comment.postTitle}
                      {isDeleted ? "（已删除）" : ""}
                    </span>
                    {!isDeleted ? (
                      <AdminContentPreviewDialog
                        targetType={TARGET_TYPES.post}
                        targetId={comment.postId}
                      />
                    ) : null}
                  </span>
                </td>
                <td className={adminTruncateCell("max-w-[120px]")}>
                  {comment.author.displayName ?? comment.author.username}
                </td>
                <td className={ADMIN_TABLE.cell}>
                  {isDeleted ? (
                    <TagBadge label="Deleted" className="bg-destructive/10 text-destructive" />
                  ) : (
                    <TagBadge label="正常" />
                  )}
                </td>
                <td className={`${ADMIN_TABLE.cell} text-muted-foreground`}>
                  {formatDateTime(comment.createdAt)}
                </td>
                <td className={ADMIN_TABLE.cellRight}>
                  {!isDeleted ? (
                    <AdminConfirmButton
                      label="删除评论"
                      confirmTitle="确认删除评论？"
                      confirmDescription="此操作将软删除该评论，前台将不再显示。相关举报将自动标记为已处理。"
                      action={adminDeleteForumCommentAction}
                      hiddenFields={{ commentId: comment.id }}
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
