"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/** 路由切换时在顶栏显示进度条，弥补 prefetch 关闭后的空白等待感 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActive(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setActive(false);
    }, 450);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pathname, searchParams]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "h-full w-1/3 bg-primary",
          active && "motion-safe:animate-[route-progress_0.45s_ease-out_forwards]",
        )}
      />
    </div>
  );
}
