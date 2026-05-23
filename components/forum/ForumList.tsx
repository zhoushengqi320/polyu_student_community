import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PostCard } from "@/components/posts/PostCard";
import { ForumCategoryNav } from "@/components/forum/ForumCategoryNav";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { type PaginatedResult } from "@/types/common";
import { type PostListItem } from "@/types/post";

type ForumListProps = {
  result: PaginatedResult<PostListItem>;
  activeCategory?: string;
  canCreate: boolean;
  isLoggedIn: boolean;
};

export function ForumList({
  result,
  activeCategory,
  canCreate,
  isLoggedIn,
}: ForumListProps) {
  return (
    <div className="space-y-6">
      <ForumCategoryNav activeCategory={activeCategory} />

      {result.data.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="还没有帖子"
          description="成为第一个发帖的人，分享你的经验吧。"
          action={
            canCreate ? (
              <Button asChild>
                <Link href={ROUTES.forum.new}>发布帖子</Link>
              </Button>
            ) : isLoggedIn ? (
              <p className="text-sm text-muted-foreground">
                完成理大认证后即可发帖
              </p>
            ) : (
              <Button asChild variant="outline">
                <Link href={ROUTES.login}>登录后发帖</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {result.data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {result.hasMore ? (
            <p className="text-center text-sm text-muted-foreground">
              更多帖子分页功能即将上线（当前 {result.total} 条）
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
