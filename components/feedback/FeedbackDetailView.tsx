import { formatDateTime } from "@/lib/utils/formatDate";
import { UserIdentity } from "@/components/common/UserIdentity";
import { type ForumPostDetail } from "@/types/forum";
import { type CommentWithAuthor } from "@/types/post";

type FeedbackDetailViewProps = {
  post: ForumPostDetail;
  replies: CommentWithAuthor[];
};

export function FeedbackDetailView({ post, replies }: FeedbackDetailViewProps) {
  return (
    <article className="space-y-8">
      <div className="space-y-4 rounded-xl border p-5">
        <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <UserIdentity
            userId={post.author.id}
            name={post.author.displayName ?? post.author.username}
            avatarUrl={post.author.avatarUrl}
            size="sm"
          />
          <span>{formatDateTime(post.createdAt)}</span>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {post.content}
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          管理员回复（{replies.length}）
        </h2>
        {replies.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            暂无回复，管理员处理中。
          </p>
        ) : (
          <ul className="space-y-3">
            {replies.map((reply) => (
              <li key={reply.id} className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <UserIdentity
                    userId={reply.author.id}
                    name={reply.author.displayName ?? reply.author.username}
                    avatarUrl={reply.author.avatarUrl}
                    size="xs"
                  />
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                    管理员
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(reply.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {reply.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
