"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { searchSuggestAction } from "@/lib/search/actions";
import { SearchSnippet } from "@/components/search/SearchSnippet";
import { type SearchHit } from "@/lib/search/types";
import { cn } from "@/lib/utils/cn";

const TYPE_LABELS: Record<SearchHit["type"], string> = {
  course: "课程",
  forum: "讨论",
  study: "学习",
  life: "生活",
  guide: "攻略",
  food: "美食",
};

type NavbarSearchProps = {
  className?: string;
};

export function NavbarSearch({ className }: NavbarSearchProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
        setHits([]);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const nextHits = await searchSuggestAction(q);
        setHits(nextHits);
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  function close() {
    setOpen(false);
    setQuery("");
    setHits([]);
  }

  function submitSearch(value?: string) {
    const q = (value ?? query).trim();
    close();
    router.push(ROUTES.search(q || undefined));
  }

  const overlay =
    open && mounted
      ? createPortal(
          <button
            type="button"
            aria-label="关闭搜索"
            // 低于页眉 z-50，高于页面内容，实现「整页变暗、搜索栏仍可用」
            className="fixed inset-0 z-40 bg-black/45"
            onClick={close}
          />,
          document.body,
        )
      : null;

  return (
    <>
      {overlay}

      <div ref={rootRef} className={cn("relative z-[90]", className)}>
        <div className="flex items-center justify-end">
          {!open ? (
            <button
              type="button"
              aria-label="打开搜索"
              onClick={() => setOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              <Search className="h-4 w-4" />
            </button>
          ) : (
            <form
              className="flex items-center gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary-foreground/70" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  placeholder="搜索课程、指南、帖子…"
                  className="h-9 w-[min(52vw,18rem)] rounded-md border border-primary-foreground/25 bg-primary-foreground/10 pl-8 pr-8 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary-foreground/40 xl:w-72"
                  autoComplete="off"
                />
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={close}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {open && query.trim().length > 0 ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[90] w-[min(92vw,22rem)] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
            <div className="max-h-80 overflow-y-auto py-1">
              {pending && hits.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">搜索中…</p>
              ) : hits.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">暂无相关结果</p>
              ) : (
                hits.map((hit) => (
                  <Link
                    key={`${hit.type}-${hit.id}`}
                    href={hit.href}
                    onClick={close}
                    className="block px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {TYPE_LABELS[hit.type]}
                      </span>
                      <p className="truncate text-sm font-medium">{hit.title}</p>
                    </div>
                    {hit.excerpt ? (
                      <SearchSnippet
                        text={hit.excerpt}
                        query={query.trim()}
                        compact
                      />
                    ) : null}
                  </Link>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => submitSearch()}
              className="w-full border-t px-3 py-2.5 text-left text-sm font-medium text-primary hover:bg-muted"
            >
              查看全部搜索结果
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
