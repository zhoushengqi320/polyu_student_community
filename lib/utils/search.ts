export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesSearch(
  text: string | null | undefined,
  query: string,
): boolean {
  if (!query) {
    return true;
  }

  if (!text) {
    return false;
  }

  return normalizeSearchQuery(text).includes(normalizeSearchQuery(query));
}

export function buildSearchPattern(query: string): string {
  return `%${normalizeSearchQuery(query).replace(/[%_]/g, "")}%`;
}
