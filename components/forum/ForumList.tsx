import Link from "next/link";
import { Suspense } from "react";
import { MessageSquarePlus } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ForumActiveFilters } from "@/components/forum/ForumActiveFilters";
import { ForumPostCard } from "@/components/forum/ForumPostCard";
import { ForumSearchBar } from "@/components/forum/ForumSearchBar";
import { ForumSortTabs } from "@/components/forum/ForumSortTabs";
import { ForumTopicFilter } from "@/components/forum/ForumTopicFilter";
import { HotPostList } from "@/components/forum/HotPostList";
import { buildForumUrl, type ForumSortId } from "@/constants/forum";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { type PaginatedResult } from "@/types/common";
import { type ForumPostListItem } from "@/types/forum";

type ForumListProps = {
  result: PaginatedResult<ForumPostListItem>;
  hotPosts: ForumPostListItem[];
  popularTopics: string[];
  activeQuery?: string;
  activeTopic?: string;
  activeCategory?: string;
  activeSort: ForumSortId;
  canCreate: boolean;
  isLoggedIn: boolean;
};

export function ForumList({
  result,
  hotPosts,
  popularTopics,
  activeQuery,
  activeTopic,
  activeCategory,
  activeSort,
  canCreate,
  isLoggedIn,
}: ForumListProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" />}>
        <ForumSearchBar />
      </Suspense>

      <ForumActiveFilters
        q={activeQuery}
        topic={activeTopic}
        category={activeCategory}
        sort={activeSort}
      />

      <ForumTopicFilter
        activeTopic={activeTopic}
        activeCategory={activeCategory}
        popularTopics={popularTopics}
        q={activeQuery}
        sort={activeSort}
      />

      <ForumSortTabs
        activeSort={activeSort}
        q={activeQuery}
        topic={activeTopic}
        category={activeCategory}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {result.data.length === 0 ? (
            <EmptyState
              icon={MessageSquarePlus}
              title="没有找到帖子"
              description={
                activeQuery || activeTopic || activeCategory
                  ? "试试调整搜索关键词或清除筛选条件。"
                  : "成为第一个发帖的人，分享你的经验吧。"
              }
              action={
                canCreate ? (
                  <Button asChild>
                    <Link href={ROUTES.forum.new}>发布帖子</Link>
                  </Button>
                ) : isLoggedIn ? (
                  <p className="text-sm text-muted-foreground">完成理大认证后即可发帖</p>
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
                  <ForumPostCard key={post.id} post={post} />
                ))}
              </div>
              {result.total > result.pageSize ? (
                <div className="flex justify-center gap-2 pt-2">
                  {result.page > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={buildForumUrl({
                          q: activeQuery,
                          topic: activeTopic,
                          category: activeCategory,
                          sort: activeSort,
                          page: result.page - 1,
                        })}
                      >
                        上一页
                      </Link>
                    </Button>
                  ) : null}
                  <span className="flex items-center text-sm text-muted-foreground">
                    第 {result.page} 页 · 共 {result.total} 条
                  </span>
                  {result.hasMore ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={buildForumUrl({
                          q: activeQuery,
                          topic: activeTopic,
                          category: activeCategory,
                          sort: activeSort,
                          page: result.page + 1,
                        })}
                      >
                        下一页
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <HotPostList posts={hotPosts} />
        </aside>
      </div>
    </div>
  );
}
