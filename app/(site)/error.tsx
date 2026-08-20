"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Site error boundary:", error);
  }, [error]);

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">页面出了点问题</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        请稍后重试。若持续出现，可返回首页继续浏览。
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          重试
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={ROUTES.home}>返回首页</Link>
        </Button>
      </div>
    </div>
  );
}
