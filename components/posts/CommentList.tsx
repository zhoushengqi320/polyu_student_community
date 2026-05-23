import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { type CommentWithAuthor } from "@/types/post";

type CommentListProps = {
  comments: CommentWithAuthor[];
};

function getAuthorName(comment: CommentWithAuthor): string {
  return comment.author.displayName ?? comment.author.username;
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        暂无评论，来抢沙发吧。
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="rounded-lg border bg-muted/20 px-4 py-3"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
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
          <p className="whitespace-pre-wrap text-sm leading-6">{comment.content}</p>
        </li>
      ))}
    </ul>
  );
}
