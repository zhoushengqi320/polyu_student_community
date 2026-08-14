"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { buildForumUrl, type ForumSortId } from "@/constants/forum";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ForumSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      router.push(
        buildForumUrl({
          q: value,
          topic: searchParams.get("topic") ?? undefined,
          sort: (searchParams.get("sort") as ForumSortId | null) ?? undefined,
        }),
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="搜索帖子标题、内容或话题（支持中英文）..."
          className="pl-9"
          name="q"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "搜索中..." : "搜索"}
      </Button>
    </form>
  );
}
