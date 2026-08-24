"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CONTENT_HIGHLIGHT_MS,
  CONTENT_HIGHLIGHT_PARAM,
} from "@/constants/contentHighlight";

const ContentHighlightContext = createContext<string | null>(null);

export function ContentHighlightProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get(CONTENT_HIGHLIGHT_PARAM)?.trim() ?? "";
  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightParam) {
      setTargetId(null);
      return;
    }

    setTargetId(highlightParam);
    const timer = window.setTimeout(() => {
      setTargetId(null);
    }, CONTENT_HIGHLIGHT_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, highlightParam]);

  return (
    <ContentHighlightContext.Provider value={targetId}>
      {children}
    </ContentHighlightContext.Provider>
  );
}

export function useHighlightTargetId(): string | null {
  return useContext(ContentHighlightContext);
}
