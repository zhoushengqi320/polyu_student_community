import { formatDateTime } from "@/lib/utils/formatDate";
import { RichContent } from "@/components/common/RichContent";
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
            role={post.author.role}
            size="sm"
          />
          <span>{formatDateTime(post.createdAt)}</span>
        </div>
        <RichContent content={post.content} className="text-sm" />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          官方回复（{replies.length}）
        </h2>
        {replies.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            暂无回复，处理中。
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
                    role={reply.author.role}
                    size="xs"
                  />
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
