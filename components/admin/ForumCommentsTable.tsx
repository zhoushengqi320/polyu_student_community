"use client";

import { MessageSquare } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { AdminContentPreviewDialog } from "@/components/admin/AdminContentPreviewDialog";
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
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 font-medium">评论内容</th>
            <th className="px-4 py-3 font-medium">所属帖子</th>
            <th className="px-4 py-3 font-medium">作者</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">时间</th>
            <th className="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => {
            const isDeleted = Boolean(comment.deletedAt);

            return (
              <tr key={comment.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="line-clamp-2 max-w-xs">{comment.content}</p>
                </td>
                <td className="px-4 py-3">
                  {isDeleted ? (
                    <span className="text-muted-foreground line-clamp-1 max-w-[180px]">
                      {comment.postTitle}
                      <span className="mt-1 block text-xs">已删除（仅日志）</span>
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <span className="line-clamp-1 max-w-[180px]">
                        {comment.postTitle}
                      </span>
                      <AdminContentPreviewDialog
                        targetType={TARGET_TYPES.post}
                        targetId={comment.postId}
                      />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {comment.author.displayName ?? comment.author.username}
                </td>
                <td className="px-4 py-3">
                  {isDeleted ? (
                    <TagBadge label="Deleted" className="bg-destructive/10 text-destructive" />
                  ) : (
                    <TagBadge label="正常" />
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(comment.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
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
