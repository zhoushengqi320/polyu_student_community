"use server";

import { searchGlobal, type SearchHit } from "@/lib/db/search";

export async function searchSuggestAction(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 1) {
    return [];
  }

  const result = await searchGlobal({ query: q, type: "all" });
  return result.hits.slice(0, 8);
}
