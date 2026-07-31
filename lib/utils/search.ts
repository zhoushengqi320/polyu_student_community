export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function buildSearchPattern(query: string): string {
  return `%${normalizeSearchQuery(query).replace(/[%_]/g, "")}%`;
}
