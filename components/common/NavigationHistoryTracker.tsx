"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  locationKeyFrom,
  syncNavigationHistory,
} from "@/lib/utils/navigationHistory";

export function NavigationHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    syncNavigationHistory(locationKeyFrom(pathname, search));
  }, [pathname, search]);

  return null;
}
