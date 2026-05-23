import Link from "next/link";
import { FORUM_CATEGORIES } from "@/constants/categories";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";

type ForumCategoryNavProps = {
  activeCategory?: string;
};

export function ForumCategoryNav({ activeCategory }: ForumCategoryNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href={ROUTES.forum.list}
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
          href={`${ROUTES.forum.list}?category=${category.id}`}
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
    </nav>
  );
}
