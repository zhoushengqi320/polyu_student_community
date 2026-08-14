/** 课程代码检索：前缀匹配 + 相关度排序 */

export function normalizeCourseCode(value: string): string {
  return value.trim().toUpperCase().replace(/[\s\-_.]/g, "");
}

export function normalizeCourseSearchQuery(query: string): string {
  return normalizeCourseCode(query);
}

export type CourseSearchRank = {
  tier: number;
  tieBreak: string;
  code: string;
};

/** 数字后缀排序：1-9 在前，0 在后 */
function digitSortKey(suffix: string): string {
  return suffix.replace(/\d/g, (digit) => (digit === "0" ? "9" : digit));
}

/**
 * 课程代码与检索词的相关度（tier 越小越靠前）：
 * 0 完全相同
 * 1 前缀匹配且下一字符为字母 → 按 A-Z
 * 2 前缀匹配且下一字符为数字 → 按 1-9（0 靠后）
 * 3 其他前缀延伸
 * 4 代码中包含（非前缀）
 */
export function getCourseSearchRank(query: string, code: string): CourseSearchRank {
  const q = normalizeCourseSearchQuery(query);
  const c = normalizeCourseCode(code);

  if (!q) {
    return { tier: 50, tieBreak: c, code: c };
  }

  if (q === c) {
    return { tier: 0, tieBreak: "", code: c };
  }

  if (c.startsWith(q)) {
    const suffix = c.slice(q.length);
    const first = suffix[0] ?? "";
    if (/[A-Z]/.test(first)) {
      return { tier: 1, tieBreak: suffix, code: c };
    }
    if (/\d/.test(first)) {
      return { tier: 2, tieBreak: digitSortKey(suffix), code: c };
    }
    return { tier: 3, tieBreak: suffix, code: c };
  }

  if (c.includes(q)) {
    return { tier: 4, tieBreak: c, code: c };
  }

  return { tier: 100, tieBreak: c, code: c };
}

export type CourseSearchTarget = {
  code: string;
  name: string;
  description?: string | null;
};

export function getCourseSearchRankForCourse(
  query: string,
  course: CourseSearchTarget,
): CourseSearchRank {
  const codeRank = getCourseSearchRank(query, course.code);
  if (codeRank.tier < 100) {
    return codeRank;
  }

  const q = query.trim().toLowerCase();
  if (!q) {
    return codeRank;
  }

  const name = course.name.toLowerCase();
  if (name.includes(q)) {
    return {
      tier: 10,
      tieBreak: course.name,
      code: normalizeCourseCode(course.code),
    };
  }

  const description = course.description?.toLowerCase() ?? "";
  if (description.includes(q)) {
    return {
      tier: 11,
      tieBreak: course.name,
      code: normalizeCourseCode(course.code),
    };
  }

  return codeRank;
}

export function compareCourseSearchRank(
  query: string,
  a: CourseSearchTarget,
  b: CourseSearchTarget,
): number {
  const rankA = getCourseSearchRankForCourse(query, a);
  const rankB = getCourseSearchRankForCourse(query, b);

  if (rankA.tier !== rankB.tier) {
    return rankA.tier - rankB.tier;
  }

  const tie = rankA.tieBreak.localeCompare(rankB.tieBreak, "en", {
    sensitivity: "base",
  });
  if (tie !== 0) {
    return tie;
  }

  return rankA.code.localeCompare(rankB.code, "en", { sensitivity: "base" });
}

/** Supabase .or() 过滤：代码前缀 + 名称/简介包含（用 * 避免 % 被 URL 编码） */
export function buildCourseSearchOrFilter(query: string): string {
  const q = normalizeCourseSearchQuery(query).replace(/[*]/g, "");
  if (!q) {
    return "";
  }

  const prefix = `${q}*`;
  const contains = `*${q}*`;
  // 短课程代码类关键词跳过 description 全文扫描（否则会极慢）
  if (/^[A-Z0-9]+$/i.test(q) && q.length <= 10) {
    return `code.ilike.${prefix},name.ilike.${contains}`;
  }

  return `code.ilike.${prefix},name.ilike.${contains},description.ilike.${contains}`;
}

export function sortCoursesBySearchRelevance<T extends CourseSearchTarget>(
  courses: T[],
  query: string,
): T[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return courses;
  }

  return [...courses].sort((a, b) => compareCourseSearchRank(trimmed, a, b));
}
