import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { GuideCard } from "@/components/guides/GuideCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GUIDE_CATEGORIES } from "@/constants/guides";
import { ROUTES } from "@/constants/routes";
import { type GuideListResult } from "@/types/guide";

type GuideListProps = {
  result: GuideListResult;
  query?: string;
  category?: string;
};

function buildGuidesUrl(params: {
  q?: string;
  category?: string;
  page?: number;
}) {
  const search = new URLSearchParams();

  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }
  if (params.category) {
    search.set("category", params.category);
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  const query = search.toString();
  return query ? `${ROUTES.guides.list}?${query}` : ROUTES.guides.list;
}

export function GuideList({ result, query, category }: GuideListProps) {
  return (
    <div className="space-y-6">
      <form className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            defaultValue={query}
            placeholder="搜索攻略标题或正文，例如 选课、宿舍、电话卡"
            className="pl-9"
          />
        </div>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">全部分类</option>
          {GUIDE_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <Button type="submit">搜索</Button>
      </form>

      {result.data.length === 0 ? (
        <EmptyState
          title="暂无攻略"
          description="如果你刚创建了 seed 数据，请确认已经在 Supabase 执行 seed_guides.sql。"
          action={
            query || category ? (
              <Button asChild variant="outline">
                <Link href={ROUTES.guides.list}>清除筛选</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {result.data.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>

          {result.total > result.pageSize ? (
            <div className="flex justify-center gap-2">
              {result.page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildGuidesUrl({
                      q: query,
                      category,
                      page: result.page - 1,
                    })}
                  >
                    上一页
                  </Link>
                </Button>
              ) : null}
              <span className="flex items-center text-sm text-muted-foreground">
                第 {result.page} 页 · 共 {result.total} 篇攻略
              </span>
              {result.hasMore ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildGuidesUrl({
                      q: query,
                      category,
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
  );
}
