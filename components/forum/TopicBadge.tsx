import Link from "next/link";
import { buildForumUrl } from "@/constants/forum";
import { cn } from "@/lib/utils/cn";

type TopicBadgeProps = {
  topic: string;
  href?: string;
  className?: string;
};

export function TopicBadge({ topic, href, className }: TopicBadgeProps) {
  const classes = cn(
    "inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground transition-colors",
    href && "hover:bg-primary/10 hover:text-primary",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        #{topic}
      </Link>
    );
  }

  return <span className={classes}>#{topic}</span>;
}

export function topicFilterHref(topic: string, current: {
  q?: string;
  category?: string;
  sort?: string;
}) {
  return buildForumUrl({
    q: current.q,
    category: current.category,
    sort: current.sort as never,
    topic,
  });
}
