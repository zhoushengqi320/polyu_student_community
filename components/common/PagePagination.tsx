"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

type PagePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  /** 例如 /courses */
  basePath: string;
  /** 除 page 以外的查询参数 */
  query?: Record<string, string | undefined>;
  /** 中间连续可点页码数量，默认 5 */
  windowSize?: number;
  className?: string;
};

type PageItem = number | "ellipsis";

function buildPageHref(
  basePath: string,
  query: Record<string, string | undefined> | undefined,
  page: number,
) {
  const search = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value?.trim()) {
        search.set(key, value.trim());
      }
    }
  }
  if (page > 1) {
    search.set("page", String(page));
  }
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * PolyU 风格页码窗口：
 * - 中间连续展示 windowSize 个页码（默认 5，以当前页居中）
 * - 左侧必要时显示首页；若窗口最小值 > 2，则首页与窗口之间用不可点的 ...
 * - 右侧同理显示末页与 ...
 */
export function getPaginationItems(
  currentPage: number,
  totalPages: number,
  windowSize = 5,
): PageItem[] {
  if (totalPages <= 1) {
    return [1];
  }

  if (totalPages <= windowSize + 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(windowSize / 2);
  let start = currentPage - half;
  let end = currentPage + half;

  if (start < 1) {
    start = 1;
    end = windowSize;
  }
  if (end > totalPages) {
    end = totalPages;
    start = totalPages - windowSize + 1;
  }

  const items: PageItem[] = [];

  if (start > 1) {
    items.push(1);
    if (start > 2) {
      items.push("ellipsis");
    }
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      items.push("ellipsis");
    }
    items.push(totalPages);
  }

  return items;
}

export function PagePagination({
  page,
  pageSize,
  total,
  basePath,
  query,
  windowSize = 5,
  className,
}: PagePaginationProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const [draftPage, setDraftPage] = useState(String(currentPage));

  const items = useMemo(
    () => getPaginationItems(currentPage, totalPages, windowSize),
    [currentPage, totalPages, windowSize],
  );

  useEffect(() => {
    setDraftPage(String(currentPage));
  }, [currentPage]);

  if (total <= pageSize) {
    return null;
  }

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  function hrefForPage(target: number) {
    return buildPageHref(basePath, query, target);
  }

  function jumpToPage(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setDraftPage(String(currentPage));
      return;
    }
    const target = Math.min(totalPages, Math.max(1, parsed));
    setDraftPage(String(target));
    if (target !== currentPage) {
      router.push(hrefForPage(target));
    }
  }

  return (
    <nav
      aria-label="分页"
      className={cn(
        "grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]",
        className,
      )}
    >
      <div className="hidden sm:block" aria-hidden="true" />

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {canPrev ? (
          <Link
            href={hrefForPage(currentPage - 1)}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            上一页
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center justify-center rounded-md border border-muted bg-muted/30 px-3 text-sm font-medium text-muted-foreground/50">
            上一页
          </span>
        )}

        <div className="mx-1 flex flex-wrap items-center justify-center gap-1 sm:mx-2">
          {items.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1.5 py-1 text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            const isActive = item === currentPage;
            return (
              <Link
                key={item}
                href={hrefForPage(item)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-w-8 items-center justify-center rounded px-2 py-1 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-foreground hover:bg-muted/60 hover:text-primary",
                )}
              >
                {item}
              </Link>
            );
          })}
        </div>

        {canNext ? (
          <Link
            href={hrefForPage(currentPage + 1)}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
          >
            下一页
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center justify-center rounded-md border border-muted bg-muted/30 px-3 text-sm font-medium text-muted-foreground/50">
            下一页
          </span>
        )}
      </div>

      <form
        className="flex items-center justify-center gap-2 sm:justify-end"
        onSubmit={(event) => {
          event.preventDefault();
          jumpToPage(draftPage);
        }}
      >
        <label htmlFor="page-jump" className="text-sm text-muted-foreground">
          跳至
        </label>
        <Input
          id="page-jump"
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          value={draftPage}
          onChange={(event) => setDraftPage(event.target.value)}
          className="h-8 w-14 px-2 text-center"
          aria-label="跳转页码"
        />
        <Button type="submit" size="sm" className="h-8 px-4">
          跳转
        </Button>
      </form>
    </nav>
  );
}
