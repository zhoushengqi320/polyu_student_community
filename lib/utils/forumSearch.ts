/** 论坛帖子模糊检索：中文 / 英文 / 中英互搜 */

import {
  englishWordFuzzy,
  expandForumSearchTerms,
  hasChineseText,
  hasLatinText,
  normalizeForumSearchText,
  tokenizeEnglishText,
} from "@/lib/utils/forumSearchLexicon";

export type ForumSearchTarget = {
  title: string;
  content: string;
  excerpt?: string | null;
  topics?: string[] | null;
};

export type ForumSearchRank = {
  tier: number;
  tieBreak: string;
};

function uniqueChars(text: string): string[] {
  return [...new Set([...text])];
}

function charOverlapRatio(a: string, b: string): number {
  const charsA = uniqueChars(a);
  if (charsA.length === 0) {
    return 0;
  }
  const setB = new Set(uniqueChars(b));
  const shared = charsA.filter((char) => setB.has(char)).length;
  return shared / charsA.length;
}

function sharedSubstringLength(a: string, b: string): number {
  let max = 0;
  const x = a.length <= b.length ? a : b;
  const y = a.length <= b.length ? b : a;

  for (let len = x.length; len >= 1; len--) {
    for (let i = 0; i <= x.length - len; i++) {
      const part = x.slice(i, i + len);
      if (y.includes(part)) {
        max = Math.max(max, len);
        break;
      }
    }
    if (max >= len) {
      break;
    }
  }

  return max;
}

function getChineseFuzzyRank(query: string, target: string): ForumSearchRank | null {
  const q = normalizeForumSearchText(query);
  const t = normalizeForumSearchText(target);
  if (!q || !t) {
    return null;
  }

  if (t === q) {
    return { tier: 0, tieBreak: t };
  }

  if (t.includes(q) || q.includes(t)) {
    return { tier: 1, tieBreak: t };
  }

  const overlap = sharedSubstringLength(q, t);
  if (overlap >= 2) {
    return { tier: 2, tieBreak: `${String(overlap).padStart(2, "0")}${t}` };
  }

  const ratio = charOverlapRatio(q, t);
  const threshold = q.length <= 2 ? 0.5 : q.length <= 3 ? 0.67 : 0.5;
  if (ratio >= threshold) {
    return { tier: 3, tieBreak: `${String(ratio).padStart(4, "0")}${t}` };
  }

  return null;
}

function getEnglishFuzzyRank(query: string, target: string): ForumSearchRank | null {
  const q = normalizeForumSearchText(query);
  const t = normalizeForumSearchText(target);
  if (!q || !t) {
    return null;
  }

  if (t === q) {
    return { tier: 0, tieBreak: t };
  }

  const queryTokens = tokenizeEnglishText(q);
  const targetTokens = tokenizeEnglishText(t);

  if (q.length >= 4 && t.includes(q)) {
    return { tier: 1, tieBreak: t };
  }

  if (t.length >= 4 && q.includes(t)) {
    return { tier: 1, tieBreak: t };
  }

  for (const queryToken of queryTokens) {
    for (const targetToken of targetTokens) {
      if (queryToken === targetToken) {
        return { tier: 1, tieBreak: targetToken };
      }
      if (englishWordFuzzy(queryToken, targetToken)) {
        return { tier: 2, tieBreak: targetToken };
      }
    }
  }

  if (queryTokens.some((token) => token.length >= 4 && t.includes(token))) {
    return { tier: 2, tieBreak: t };
  }

  if (targetTokens.some((token) => token.length >= 4 && q.includes(token))) {
    return { tier: 2, tieBreak: t };
  }

  return null;
}

function getDirectTermRank(query: string, target: string): ForumSearchRank | null {
  const q = normalizeForumSearchText(query);
  const t = normalizeForumSearchText(target);
  if (!q || !t) {
    return null;
  }

  const qChinese = hasChineseText(q);
  const qLatin = hasLatinText(q);
  const tChinese = hasChineseText(t);
  const tLatin = hasLatinText(t);

  if (qChinese && tChinese) {
    return getChineseFuzzyRank(q, t);
  }

  if (qLatin && tLatin) {
    return getEnglishFuzzyRank(q, t);
  }

  return null;
}

function getExpandedTermRank(term: string, target: string, fromExpansion: boolean): ForumSearchRank | null {
  const direct = getDirectTermRank(term, target);
  if (!direct) {
    return null;
  }

  if (!fromExpansion) {
    return direct;
  }

  return {
    tier: direct.tier + 4,
    tieBreak: `${String(direct.tier).padStart(2, "0")}${direct.tieBreak}`,
  };
}

function getTextFieldRank(query: string, text: string): ForumSearchRank | null {
  const q = normalizeForumSearchText(query);
  const value = normalizeForumSearchText(text);
  if (!q || !value) {
    return null;
  }

  const direct = getDirectTermRank(q, value);
  if (direct) {
    return { tier: direct.tier + 5, tieBreak: direct.tieBreak };
  }

  const expandedTerms = expandForumSearchTerms(query);
  for (const term of expandedTerms) {
    if (term === q) {
      continue;
    }
    const expanded = getDirectTermRank(term, value);
    if (expanded) {
      return { tier: expanded.tier + 8, tieBreak: expanded.tieBreak };
    }
  }

  return null;
}

function pickBestRank(current: ForumSearchRank, candidate: ForumSearchRank | null): ForumSearchRank {
  if (!candidate || candidate.tier >= current.tier) {
    return current;
  }
  return candidate;
}

function rankTarget(query: string, target: string): ForumSearchRank {
  let best: ForumSearchRank = { tier: 100, tieBreak: target };

  best = pickBestRank(best, getDirectTermRank(query, target));

  const expandedTerms = expandForumSearchTerms(query);
  for (const term of expandedTerms) {
    if (term === normalizeForumSearchText(query)) {
      continue;
    }
    best = pickBestRank(best, getExpandedTermRank(term, target, true));
  }

  return best;
}

export function getForumSearchRank(
  query: string,
  post: ForumSearchTarget,
): ForumSearchRank {
  const q = query.trim();
  if (!q) {
    return { tier: 99, tieBreak: post.title };
  }

  let best: ForumSearchRank = { tier: 100, tieBreak: post.title };

  for (const topic of post.topics ?? []) {
    best = pickBestRank(best, rankTarget(q, topic));
  }

  for (const field of [post.title, post.excerpt ?? "", post.content]) {
    best = pickBestRank(best, getTextFieldRank(q, field));
  }

  return best;
}

export function matchesForumSearch(query: string, post: ForumSearchTarget): boolean {
  const q = query.trim();
  if (!q) {
    return true;
  }
  return getForumSearchRank(q, post).tier < 100;
}

export function compareForumSearchRank(
  query: string,
  a: ForumSearchTarget,
  b: ForumSearchTarget,
): number {
  const rankA = getForumSearchRank(query, a);
  const rankB = getForumSearchRank(query, b);

  if (rankA.tier !== rankB.tier) {
    return rankA.tier - rankB.tier;
  }

  return rankA.tieBreak.localeCompare(rankB.tieBreak, "zh-CN", {
    sensitivity: "base",
  });
}

export function sortForumPostsBySearchRelevance<T extends ForumSearchTarget>(
  posts: T[],
  query: string,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return posts;
  }

  return [...posts].sort((a, b) => compareForumSearchRank(trimmed, a, b));
}
