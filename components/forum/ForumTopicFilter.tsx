import Link from "next/link";
import {
  FORUM_TOPIC_SUGGESTIONS,
  buildForumUrl,
  type ForumSortId,
} from "@/constants/forum";
import { TopicBadge } from "@/components/forum/TopicBadge";

type ForumTopicFilterProps = {
  activeTopic?: string;
  popularTopics: string[];
  q?: string;
  sort: ForumSortId;
};

export function ForumTopicFilter({
  activeTopic,
  popularTopics,
  q,
  sort,
}: ForumTopicFilterProps) {
  const filterBase = { q, sort };

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">热门话题</h3>
      <div className="flex flex-wrap gap-2">
        {[...new Set([...popularTopics, ...FORUM_TOPIC_SUGGESTIONS])]
          .slice(0, 16)
          .map((topic) => (
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
          ))}
        {activeTopic ? (
          <Link
            href={buildForumUrl(filterBase)}
            className="rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            清除话题
          </Link>
        ) : null}
      </div>
    </div>
  );
}
