"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import { AdminConfirmButton } from "@/components/admin/AdminConfirmButton";
import { adminDeleteForumPostAction } from "@/lib/admin/actions";
import { ROUTES } from "@/constants/routes";
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
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="border-b bg-muted/40">
          <tr>
            <th className="px-4 py-3 font-medium">标题</th>
            <th className="px-4 py-3 font-medium">作者</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">发布时间</th>
            <th className="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const isDeleted = Boolean(post.deletedAt);

            return (
              <tr key={post.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={ROUTES.forum.detail(post.id)}
                    className="font-medium hover:text-primary line-clamp-2"
                  >
                    {post.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {post.author.displayName ?? post.author.username}
                </td>
                <td className="px-4 py-3">
                  {isDeleted ? (
                    <TagBadge label="Deleted" className="bg-destructive/10 text-destructive" />
                  ) : (
                    <TagBadge label="正常" />
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(post.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {!isDeleted ? (
                    <AdminConfirmButton
                      label="删除帖子"
                      confirmTitle="确认删除帖子？"
                      confirmDescription="此操作将软删除该帖子，前台将不再显示。相关举报将自动标记为已处理。"
                      action={adminDeleteForumPostAction}
                      hiddenFields={{ postId: post.id }}
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
