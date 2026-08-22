"use client";

import { useState } from "react";
import { ReportDialog } from "@/components/common/ReportDialog";
import { UserIdentity } from "@/components/common/UserIdentity";
import {
  CommentLikeButton,
  CommentReplyTrigger,
} from "@/components/forum/CommentLikeButton";
import { CommentReplyForm } from "@/components/forum/CommentReplyForm";
import { DeleteCommentButton } from "@/components/posts/DeleteCommentButton";
import { FORUM_REPORT_TARGET_TYPES } from "@/constants/reportReasons";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";
import { type CommentReactionSummary, type CommentThreadItem } from "@/types/post";

type ForumCommentListProps = {
  comments: CommentThreadItem[];
  postId: string;
  isLoggedIn: boolean;
  canComment: boolean;
  canLike: boolean;
  totalCount: number;
  revalidatePath?: string;
  currentUserId?: string | null;
  isAdmin?: boolean;
  reactionMap: Record<string, CommentReactionSummary>;
};

function getAuthorName(comment: CommentThreadItem): string {
  return comment.author.displayName ?? comment.author.username;
}

function flattenReplies(comment: CommentThreadItem): CommentThreadItem[] {
  return comment.replies.flatMap((reply) => [
    reply,
    ...flattenReplies(reply),
  ]);
}

type CommentItemProps = {
  comment: CommentThreadItem;
  postId: string;
  isLoggedIn: boolean;
  canComment: boolean;
  canLike: boolean;
  revalidatePath: string;
  currentUserId?: string | null;
  isAdmin?: boolean;
  reactionMap: Record<string, CommentReactionSummary>;
  replyTargetName?: string;
  nested?: boolean;
};

function CommentItem({
  comment,
  postId,
  isLoggedIn,
  canComment,
  canLike,
  revalidatePath,
  currentUserId,
  isAdmin = false,
  reactionMap,
  replyTargetName,
  nested = false,
}: CommentItemProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const reaction = reactionMap[comment.id] ?? { count: 0, isLiked: false };
  const canDelete =
    isLoggedIn && (isAdmin || (currentUserId != null && comment.userId === currentUserId));

  return (
    <li
      className={cn(
        "rounded-lg border px-4 py-3",
        nested ? "ml-4 border-l-2 border-l-primary/20 bg-background sm:ml-6" : "bg-muted/20",
      )}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2 text-sm">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <UserIdentity
            userId={comment.author.id}
            name={getAuthorName(comment)}
            avatarUrl={comment.author.avatarUrl}
            role={comment.author.role}
            size="xs"
          />
          {replyTargetName ? (
            <span className="text-xs text-muted-foreground">
              · 回复 @{replyTargetName}
            </span>
          ) : null}
          <span className="text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canDelete ? (
            <DeleteCommentButton
              commentId={comment.id}
              revalidatePath={revalidatePath}
            />
          ) : null}
          <ReportDialog
            targetType={FORUM_REPORT_TARGET_TYPES.comment}
            targetId={comment.id}
            isLoggedIn={isLoggedIn}
            ownerId={comment.userId}
            currentUserId={currentUserId}
            revalidatePath={revalidatePath}
            triggerLabel="举报"
            triggerVariant="ghost"
            triggerSize="sm"
          />
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6">{comment.content}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <CommentLikeButton
          commentId={comment.id}
          likeCount={reaction.count}
          isLiked={reaction.isLiked}
          canInteract={canLike}
          isLoggedIn={isLoggedIn}
          revalidatePath={revalidatePath}
        />
        <CommentReplyTrigger
          canComment={canComment}
          isLoggedIn={isLoggedIn}
          onClick={() => setReplyOpen((open) => !open)}
        />
      </div>

      {replyOpen && canComment ? (
        <CommentReplyForm
          postId={postId}
          parentCommentId={comment.id}
          replyToName={getAuthorName(comment)}
          revalidatePath={revalidatePath}
          onCancel={() => setReplyOpen(false)}
        />
      ) : null}
    </li>
  );
}

function CommentThreadNode({
  comment,
  postId,
  isLoggedIn,
  canComment,
  canLike,
  revalidatePath,
  currentUserId,
  isAdmin,
  reactionMap,
}: Omit<CommentItemProps, "replyTargetName" | "nested">) {
  const replies = flattenReplies(comment);
  const commentsById = new Map(
    [comment, ...replies].map((item) => [item.id, item]),
  );

  return (
    <div className="space-y-3">
      <ul className="space-y-0">
        <CommentItem
          comment={comment}
          postId={postId}
          isLoggedIn={isLoggedIn}
          canComment={canComment}
          canLike={canLike}
          revalidatePath={revalidatePath}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          reactionMap={reactionMap}
        />
      </ul>

      {replies.length > 0 ? (
        <ul className="space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              isLoggedIn={isLoggedIn}
              canComment={canComment}
              canLike={canLike}
              revalidatePath={revalidatePath}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              reactionMap={reactionMap}
              replyTargetName={getAuthorName(
                commentsById.get(reply.parentId ?? "") ?? comment,
              )}
              nested
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ForumCommentList({
  comments,
  postId,
  isLoggedIn,
  canComment,
  canLike,
  totalCount,
  revalidatePath = ROUTES.forum.detail(postId),
  currentUserId,
  isAdmin = false,
  reactionMap,
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
          <li key={comment.id}>
            <CommentThreadNode
              comment={comment}
              postId={postId}
              isLoggedIn={isLoggedIn}
              canComment={canComment}
              canLike={canLike}
              revalidatePath={revalidatePath}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              reactionMap={reactionMap}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
