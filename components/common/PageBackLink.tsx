"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  canUseHistoryBack,
  getPreviousPath,
  locationKeyFrom,
  pageNameFromPath,
} from "@/lib/utils/navigationHistory";

type PageBackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

/** 返回上一级：优先回到来源页（如通知），否则回模块默认上级 */
export function PageBackLink({ href, label, className }: PageBackLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = locationKeyFrom(pathname, searchParams.toString());
  const [previous, setPrevious] = useState<string | null>(null);

  useEffect(() => {
    setPrevious(getPreviousPath(current));
  }, [current]);

  const targetHref = previous ?? href;
  const targetLabel = previous ? pageNameFromPath(previous) : label;

  return (
    <Link
      href={targetHref}
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      onClick={(event) => {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        if (previous && canUseHistoryBack()) {
          router.back();
          return;
        }
        if (previous) {
          router.replace(previous);
          return;
        }
        router.push(href);
      }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      返回{targetLabel}
    </Link>
  );
}
