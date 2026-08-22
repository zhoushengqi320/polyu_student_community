import Link from "next/link";
import { CircleHelp, MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/formatDate";
import { ROUTES } from "@/constants/routes";
import { UserIdentity } from "@/components/common/UserIdentity";
import { EmptyState } from "@/components/common/EmptyState";
import { type ForumPostListItem } from "@/types/forum";
import { type PaginatedResult } from "@/types/common";

type FeedbackListProps = {
  result: PaginatedResult<ForumPostListItem>;
};

export function FeedbackList({ result }: FeedbackListProps) {
  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={CircleHelp}
        title="暂无反馈"
        description="遇到问题或有建议时，可以提交一条反馈。"
      />
    );
  }

  return (
    <ul className="divide-y rounded-xl border">
      {result.data.map((item) => (
        <li key={item.id}>
          <Link
            href={ROUTES.feedback.detail(item.id)}
            prefetch={false}
            className="block px-4 py-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <h2 className="font-medium leading-snug">{item.title}</h2>
                {item.excerpt ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {item.excerpt}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <UserIdentity
                    userId={item.author.id}
                    name={item.author.displayName ?? item.author.username}
                    avatarUrl={item.author.avatarUrl}
                    role={item.author.role}
                    size="xs"
                    nameClassName="text-xs font-normal text-muted-foreground"
                  />
                  <span>{formatRelativeTime(item.createdAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {item.commentCount} 回复
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
