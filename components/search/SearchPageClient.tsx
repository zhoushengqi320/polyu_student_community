"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PagePagination } from "@/components/common/PagePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { isFeatureEnabled } from "@/constants/features";
import { cn } from "@/lib/utils/cn";
import { SearchSnippet } from "@/components/search/SearchSnippet";
import {
  getSearchResultTotalCount,
  type GlobalSearchResult,
  type SearchHitType,
} from "@/lib/search/types";
import {
  SEARCH_RESULT_TYPES,
  type SearchResultTypeFilter,
} from "@/lib/validations/searchSchema";

const TYPE_LABELS: Record<SearchResultTypeFilter, string> = {
  all: "全部",
  course: "课程",
  forum: "讨论",
  study: "学习指南",
  life: "生活指南",
  guide: "入学攻略",
  food: "吃喝玩乐",
};

type SearchPageClientProps = {
  result: GlobalSearchResult;
};

export function SearchPageClient({ result }: SearchPageClientProps) {
  const router = useRouter();
  const includeGuides = isFeatureEnabled("seasonalGuides");
  const filters = SEARCH_RESULT_TYPES.filter(
    (type) => type !== "guide" || includeGuides,
  );
  const activeTotal = getSearchResultTotalCount(result);
  const allTypeSum = Object.values(result.counts).reduce((sum, n) => sum + n, 0);
  const showAllCapHint =
    result.type === "all" && result.query && allTypeSum > result.total;

  return (
    <div className="space-y-6">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const q = String(formData.get("q") ?? "").trim();
          router.push(ROUTES.search(q || undefined, result.type));
        }}
      >
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            name="q"
            type="search"
            defaultValue={result.query}
            placeholder="搜索课程、指南、帖子、攻略、吃喝玩乐…"
            className="h-11 pl-9"
          />
        </div>
        <Button type="submit" className="h-11 sm:px-8">
          搜索
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {filters.map((type) => {
          const count =
            type === "all"
              ? result.type === "all"
                ? result.total
                : allTypeSum
              : result.counts[type as SearchHitType];
          const active = result.type === type;
          return (
            <Link
              key={type}
              href={ROUTES.search(result.query || undefined, type)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
              )}
            >
              {TYPE_LABELS[type]}
              {result.query ? ` · ${count}` : null}
            </Link>
          );
        })}
      </div>

      {result.query && activeTotal > 0 ? (
        <p className="text-sm text-muted-foreground">
          找到 {activeTotal} 条
          {result.type !== "all" ? `「${TYPE_LABELS[result.type]}」` : ""}
          结果
          {showAllCapHint
            ? `（「全部」合并展示 ${result.total} 条；各分类合计 ${allTypeSum} 条，切换类型可查看更多）`
            : null}
        </p>
      ) : null}

      {!result.query ? (
        <EmptyState
          title="输入关键词开始搜索"
          description="可搜索课程代码/名称、讨论帖、学习与生活指南、入学攻略与吃喝玩乐。"
        />
      ) : result.hits.length === 0 ? (
        <EmptyState
          title="没有找到相关结果"
          description={`关键词「${result.query}」暂无匹配内容，试试更短的词或换个类型筛选。`}
          action={
            <Button asChild variant="outline">
              <Link href={ROUTES.courses.list}>去课程评价看看</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="divide-y rounded-lg border bg-card">
            {result.hits.map((hit) => (
              <li key={`${hit.type}-${hit.id}`}>
                <Link
                  href={hit.href}
                  className="block space-y-1 px-4 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {TYPE_LABELS[hit.type]}
                    </span>
                    {hit.meta ? (
                      <span className="text-xs text-muted-foreground">
                        {hit.meta}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-medium text-foreground">{hit.title}</p>
                  {hit.excerpt ? (
                    <SearchSnippet text={hit.excerpt} query={result.query} />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          <PagePagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            basePath="/search"
            query={{
              q: result.query || undefined,
              type: result.type === "all" ? undefined : result.type,
            }}
          />
        </>
      )}
    </div>
  );
}
