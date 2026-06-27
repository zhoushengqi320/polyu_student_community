"use client";

import Link from "next/link";
import { ReportDialog } from "@/components/common/ReportDialog";
import { CommentReplyForm } from "@/components/forum/CommentReplyForm";
import { FORUM_REPORT_TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";
import { type CommentThreadItem } from "@/types/post";

type ForumCommentListProps = {
  comments: CommentThreadItem[];
  postId: string;
  isLoggedIn: boolean;
  canComment: boolean;
  totalCount: number;
};

function getAuthorName(comment: CommentThreadItem): string {
  return comment.author.displayName ?? comment.author.username;
}

type CommentThreadNodeProps = {
  comment: CommentThreadItem;
  postId: string;
  isLoggedIn: boolean;
  canComment: boolean;
};

function flattenReplies(comment: CommentThreadItem): CommentThreadItem[] {
  return comment.replies.flatMap((reply) => [
    reply,
    ...flattenReplies(reply),
  ]);
}

function CommentActions({
  comment,
  postId,
  isLoggedIn,
  canComment,
}: CommentThreadNodeProps) {
  const revalidatePath = ROUTES.forum.detail(postId);

  return (
    <div className="flex items-center gap-1">
      {isLoggedIn ? (
        <CommentReplyForm
          postId={postId}
          parentCommentId={comment.id}
          replyToName={getAuthorName(comment)}
          canComment={canComment}
        />
      ) : null}
      <ReportDialog
        targetType={FORUM_REPORT_TARGET_TYPES.comment}
        targetId={comment.id}
        isLoggedIn={isLoggedIn}
        revalidatePath={revalidatePath}
        triggerLabel="举报"
        triggerVariant="ghost"
        triggerSize="sm"
      />
    </div>
  );
}

function CommentThreadNode({
  comment,
  postId,
  isLoggedIn,
  canComment,
}: CommentThreadNodeProps) {
  const replies = flattenReplies(comment);
  const commentsById = new Map(
    [comment, ...replies].map((item) => [item.id, item]),
  );

  return (
    <li className="rounded-lg border bg-muted/20 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={ROUTES.profile(comment.author.id)}
            className="font-medium hover:text-primary"
          >
            {getAuthorName(comment)}
          </Link>
          <span className="text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <CommentActions
          comment={comment}
          postId={postId}
          isLoggedIn={isLoggedIn}
          canComment={canComment}
        />
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6">{comment.content}</p>

      {replies.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {replies.map((reply) => (
            <li
              key={reply.id}
              className={cn(
                "rounded-lg border bg-background px-4 py-3",
                "ml-4 border-l-2 border-l-primary/20 sm:ml-6",
              )}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={ROUTES.profile(reply.author.id)}
                    className="font-medium hover:text-primary"
                  >
                    {getAuthorName(reply)}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    · 回复 @{getAuthorName(
                      commentsById.get(reply.parentId ?? "") ?? comment,
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {formatRelativeTime(reply.createdAt)}
                  </span>
                </div>
                <CommentActions
                  comment={reply}
                  postId={postId}
                  isLoggedIn={isLoggedIn}
                  canComment={canComment}
                />
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6">{reply.content}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ForumCommentList({
  comments,
  postId,
  isLoggedIn,
  canComment,
  totalCount,
}: ForumCommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        暂无评论，来抢沙发吧。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {totalCount > comments.length ? (
        <p className="text-xs text-muted-foreground">
          共 {totalCount} 条评论（含回复）
        </p>
      ) : null}
      <ul className="space-y-4">
        {comments.map((comment) => (
          <CommentThreadNode
            key={comment.id}
            comment={comment}
            postId={postId}
            isLoggedIn={isLoggedIn}
            canComment={canComment}
          />
        ))}
      </ul>
    </div>
  );
}
