/**
 * 搜索结果：从正文中抽出含关键词的整句，并切分为可高亮片段。
 * 纯函数，可在客户端与服务端共用。
 */

const SENTENCE_SPLIT = /(?<=[。！？.!?；;])\s*/u;
const MAX_SNIPPET_LENGTH = 160;

function normalizeForMatch(text: string): string {
  return text.toLocaleLowerCase();
}

/** 去掉 HTML / 多余空白，保留可读正文 */
export function plainTextForSearch(input: string | null | undefined): string {
  if (!input) {
    return "";
  }
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string): string[] {
  const normalized = plainTextForSearch(text);
  if (!normalized) {
    return [];
  }
  const parts = normalized
    .split(SENTENCE_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [normalized];
}

function windowAroundMatch(text: string, query: string, max = MAX_SNIPPET_LENGTH): string {
  const lower = normalizeForMatch(text);
  const q = normalizeForMatch(query);
  const index = lower.indexOf(q);
  if (index === -1) {
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  const idealStart = Math.max(0, index - Math.floor((max - q.length) / 2));
  let start = idealStart;
  const end = Math.min(text.length, start + max);

  if (end - start < max && start > 0) {
    start = Math.max(0, end - max);
  }

  if (start > 0) {
    const space = text.lastIndexOf(" ", start + 8);
    if (space >= start - 12 && space > 0) {
      start = space + 1;
    }
  }

  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function withContextEllipsis(
  snippet: string,
  fullText: string,
  spanStart: number,
  spanEnd: number,
): string {
  const hasBefore = spanStart > 0;
  const hasAfter = spanEnd < fullText.length;
  let result = snippet.trim();
  if (hasBefore && !result.startsWith("...")) {
    result = `...${result}`;
  }
  if (hasAfter && !result.endsWith("...")) {
    result = `${result}...`;
  }
  return result;
}

/**
 * 从多段候选文本中，抽出包含关键词的一整句（优先正文，其次标题等）。
 * 找不到完整句时，退回关键词附近的窗口文本。
 */
export function extractSearchSnippet(
  sources: Array<string | null | undefined>,
  query: string,
): string | null {
  const q = query.trim();
  if (!q) {
    return null;
  }
  const needle = normalizeForMatch(q);

  for (const source of sources) {
    const text = plainTextForSearch(source);
    if (!text || !normalizeForMatch(text).includes(needle)) {
      continue;
    }

    const sentences = splitSentences(text);
    const matched = sentences.find((sentence) =>
      normalizeForMatch(sentence).includes(needle),
    );
    if (matched) {
      const spanStart = text.indexOf(matched);
      const spanEnd =
        spanStart >= 0 ? spanStart + matched.length : matched.length;
      const core =
        matched.length > MAX_SNIPPET_LENGTH
          ? windowAroundMatch(matched, q)
          : matched;
      if (spanStart >= 0) {
        return withContextEllipsis(core, text, spanStart, spanEnd);
      }
      return core;
    }

    return windowAroundMatch(text, q);
  }

  return null;
}

export type HighlightPart = {
  text: string;
  hit: boolean;
};

/** 将文本按关键词切开，命中段可标红 */
export function splitHighlightParts(
  text: string,
  query: string,
): HighlightPart[] {
  const q = query.trim();
  if (!text) {
    return [];
  }
  if (!q) {
    return [{ text, hit: false }];
  }

  const lowerText = normalizeForMatch(text);
  const lowerQuery = normalizeForMatch(q);
  if (!lowerQuery) {
    return [{ text, hit: false }];
  }

  const parts: HighlightPart[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = lowerText.indexOf(lowerQuery, cursor);
    if (index === -1) {
      parts.push({ text: text.slice(cursor), hit: false });
      break;
    }
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), hit: false });
    }
    parts.push({
      text: text.slice(index, index + q.length),
      hit: true,
    });
    cursor = index + q.length;
  }

  return parts.filter((part) => part.text.length > 0);
}
