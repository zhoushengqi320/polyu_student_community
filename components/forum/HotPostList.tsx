import Link from "next/link";
import { Flame } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ForumPostListItem } from "@/types/forum";

type HotPostListProps = {
  posts: ForumPostListItem[];
};

export function HotPostList({ posts }: HotPostListProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />
          热门帖子
        </CardTitle>
        <CardDescription>按热度排序</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={ROUTES.forum.detail(post.id)}
            className="block rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
          >
            <div className="flex gap-2">
              <span className="shrink-0 text-sm font-medium text-muted-foreground">
                {index + 1}.
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="line-clamp-2 text-sm font-medium leading-snug">
                  {post.title}
                </p>
                <p className="text-xs text-muted-foreground">热度 {post.hotScore}</p>
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
