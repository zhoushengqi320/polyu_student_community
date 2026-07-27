"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HomeSearchBoxProps = {
  className?: string;
};

export function HomeSearchBox({ className }: HomeSearchBoxProps) {
  const router = useRouter();

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const query = String(formData.get("q") ?? "").trim();
        router.push(ROUTES.search(query || undefined));
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            type="search"
            placeholder="搜索课程、攻略、帖子、资源…"
            className="h-11 pl-9"
          />
        </div>
        <Button type="submit" className="h-11 sm:px-8">
          搜索
        </Button>
      </div>
    </form>
  );
}
