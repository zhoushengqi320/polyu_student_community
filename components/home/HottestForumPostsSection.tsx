import { ForumPostCard } from "@/components/forum/ForumPostCard";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { HomeSectionShell } from "@/components/home/HomeSectionShell";
import { ROUTES } from "@/constants/routes";
import { type HomeSectionResult } from "@/types/home";
import { type ForumPostListItem } from "@/types/forum";

type HottestForumPostsSectionProps = {
  result: HomeSectionResult<ForumPostListItem>;
};

export function HottestForumPostsSection({ result }: HottestForumPostsSectionProps) {
  return (
    <HomeSectionShell
      title="最热讨论"
      description="自由讨论区里当前最热的帖子。"
      href={ROUTES.forum.list}
      tourId="home-hottest-forum"
    >
      {result.error ? (
        <HomeEmptyState
          error
          title="最热讨论加载失败"
          description="请稍后刷新页面重试。"
        />
      ) : result.items.length === 0 ? (
        <HomeEmptyState
          title="讨论区还没有帖子"
          description="去自由讨论区发布第一条讨论吧。"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {result.items.map((post) => (
            <ForumPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </HomeSectionShell>
  );
}
