import { splitHighlightParts } from "@/lib/search/snippet";
import { cn } from "@/lib/utils/cn";

type SearchSnippetProps = {
  text: string;
  query: string;
  className?: string;
  /** 顶栏建议用更小字号 */
  compact?: boolean;
};

/** 灰色摘要行 + 关键词红色高亮 */
export function SearchSnippet({
  text,
  query,
  className,
  compact = false,
}: SearchSnippetProps) {
  const parts = splitHighlightParts(text, query);

  return (
    <p
      className={cn(
        compact
          ? "mt-0.5 line-clamp-1 text-xs text-muted-foreground"
          : "text-sm text-muted-foreground",
        className,
      )}
    >
      {parts.map((part, index) =>
        part.hit ? (
          <mark
            key={`${index}-${part.text}`}
            className="bg-transparent font-medium text-red-600"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${index}-${part.text}`}>{part.text}</span>
        ),
      )}
    </p>
  );
}
