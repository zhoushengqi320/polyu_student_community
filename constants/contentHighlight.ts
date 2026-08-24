export const CONTENT_HIGHLIGHT_PARAM = "highlight";
export const CONTENT_HIGHLIGHT_MS = 1000;

export type ContentHighlightKind =
  | "post"
  | "comment"
  | "review"
  | "rec"
  | "listing"
  | "place";

export function contentHighlightId(
  kind: ContentHighlightKind,
  id: string,
): string {
  return `${kind}-${id}`;
}

export function withContentHighlight(
  pathname: string,
  highlightId: string,
): string {
  const [pathAndQuery, hash] = pathname.split("#");
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  const next = `${pathAndQuery}${separator}${CONTENT_HIGHLIGHT_PARAM}=${encodeURIComponent(highlightId)}`;
  return hash ? `${next}#${hash}` : next;
}
