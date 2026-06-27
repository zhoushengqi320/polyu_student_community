import Link from "next/link";
import {
  FORUM_CATEGORIES,
  FORUM_TOPIC_SUGGESTIONS,
  buildForumUrl,
  type ForumSortId,
} from "@/constants/forum";
import { TopicBadge } from "@/components/forum/TopicBadge";
import { cn } from "@/lib/utils/cn";

type ForumTopicFilterProps = {
  activeTopic?: string;
  activeCategory?: string;
  popularTopics: string[];
  q?: string;
  sort: ForumSortId;
};

export function ForumTopicFilter({
  activeTopic,
  activeCategory,
  popularTopics,
  q,
  sort,
}: ForumTopicFilterProps) {
  const filterBase = { q, sort, category: activeCategory };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">分类</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildForumUrl({ ...filterBase, topic: activeTopic })}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              !activeCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
          >
            全部
          </Link>
          {FORUM_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={buildForumUrl({
                ...filterBase,
                category: category.id,
                topic: activeTopic,
              })}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                activeCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              {category.label}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">热门话题</h3>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...popularTopics, ...FORUM_TOPIC_SUGGESTIONS])].slice(0, 16).map(
            (topic) => (
              <TopicBadge
                key={topic}
                topic={topic}
                href={buildForumUrl({ ...filterBase, topic })}
                className={
                  activeTopic === topic
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : undefined
                }
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
