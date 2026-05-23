"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { matchesSearch } from "@/lib/utils/search";

export function useSearch<T>(
  items: T[],
  getSearchText: (item: T) => string,
  delay = 300,
) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, delay);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) {
      return items;
    }

    return items.filter((item) =>
      matchesSearch(getSearchText(item), debouncedQuery),
    );
  }, [items, debouncedQuery, getSearchText]);

  return {
    query,
    setQuery,
    debouncedQuery,
    filteredItems,
  };
}
