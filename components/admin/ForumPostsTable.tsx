"use client";

import { Newspaper } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { AdminContentPreviewDialog } from "@/components/admin/AdminContentPreviewDialog";
import { ADMIN_TABLE, adminTruncateCell } from "@/components/admin/adminTableClasses";
import { adminDeleteForumPostAction } from "@/lib/admin/actions";
import { TARGET_TYPES } from "@/constants/reportReasons";
import { TagBadge } from "@/components/common/TagBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDateTime } from "@/lib/utils/formatDate";
import { type AdminForumPostListItem } from "@/types/admin";

type ForumPostsTableProps = {
  posts: AdminForumPostListItem[];
};

export function ForumPostsTable({ posts }: ForumPostsTableProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="暂无帖子"
        description="自由讨论区还没有帖子。"
      />
    );
  }

  return (
    <div className={ADMIN_TABLE.wrap}>
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className={ADMIN_TABLE.headCell}>标题</th>
            <th className={ADMIN_TABLE.headCell}>作者</th>
            <th className={ADMIN_TABLE.headCell}>状态</th>
            <th className={ADMIN_TABLE.headCell}>发布时间</th>
            <th className={`${ADMIN_TABLE.headCell} text-right`}>操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const isDeleted = Boolean(post.deletedAt);

            return (
              <tr key={post.id} className={ADMIN_TABLE.row}>
                <td className={adminTruncateCell("max-w-[320px]")}>
                  <span className="inline-flex max-w-full items-center gap-2">
                    <span
                      className={isDeleted ? "text-muted-foreground" : "font-medium"}
                      title={post.title}
                    >
                      {post.title}
                      {isDeleted ? "（已删除）" : ""}
                    </span>
                    {!isDeleted ? (
                      <AdminContentPreviewDialog
                        targetType={TARGET_TYPES.post}
                        targetId={post.id}
                      />
                    ) : null}
                  </span>
                </td>
                <td className={adminTruncateCell("max-w-[140px]")}>
                  {post.author.displayName ?? post.author.username}
                </td>
                <td className={ADMIN_TABLE.cell}>
                  {isDeleted ? (
                    <TagBadge label="Deleted" className="bg-destructive/10 text-destructive" />
                  ) : (
                    <TagBadge label="正常" />
                  )}
                </td>
                <td className={`${ADMIN_TABLE.cell} text-muted-foreground`}>
                  {formatDateTime(post.createdAt)}
                </td>
                <td className={ADMIN_TABLE.cellRight}>
                  {!isDeleted ? (
                    <AdminConfirmButton
                      label="删除帖子"
                      confirmTitle="确认删除帖子？"
                      confirmDescription="此操作将软删除该帖子，前台将不再显示。相关举报将自动标记为已处理。"
                      action={adminDeleteForumPostAction}
                      hiddenFields={{ postId: post.id }}
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
