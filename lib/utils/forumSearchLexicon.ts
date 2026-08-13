/** 论坛检索双语词簇：支持中英互搜 */

export type ForumSearchTermCluster = readonly string[];

export const FORUM_SEARCH_TERM_CLUSTERS: ForumSearchTermCluster[] = [
  ["租房", "租屋", "房子", "二手房", "rent", "rental", "renting", "lease", "housing", "house", "apartment", "flat", "room"],
  ["二手", "闲置", "转让", "secondhand", "second hand", "used", "marketplace", "preloved"],
  ["宿舍", "hall", "dorm", "dormitory", "hostel", "residence"],
  ["找搭子", "搭子", "buddy", "partner", "teammate", "roommate", "study buddy"],
  ["课程", "选课", "course", "class", "subject", "module"],
  ["课程求助", "course help", "homework help", "assignment help"],
  ["考试", "复习", "exam", "test", "midterm", "final", "revision", "study"],
  ["实习", "ra", "research assistant", "intern", "internship", "placement"],
  ["美食", "餐厅", "food", "restaurant", "cafe", "dining", "eat"],
  ["校园生活", "campus life", "campus", "student life"],
  ["失物招领", "lost and found", "lost", "found"],
  ["自由讨论", "discussion", "chat", "general"],
  ["运动", "健身", "gym", "sports", "workout", "fitness"],
  ["项目", "组队", "hackathon", "mcm", "project", "team up"],
  ["室友", "roommate", "flatmate"],
  ["交通", "地铁", "bus", "mtr", "transport", "commute"],
  ["签证", "visa", "immigration"],
  ["银行", "bank", "banking", "account"],
  ["兼职", "part time", "part-time", "job", "work"],
];

export function normalizeForumSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hasChineseText(value: string): boolean {
  return /[\u4e00-\u9fff]/.test(value);
}

export function hasLatinText(value: string): boolean {
  return /[a-z]/i.test(value);
}

export function tokenizeEnglishText(value: string): string[] {
  return normalizeForumSearchText(value)
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function queryContainsTerm(query: string, term: string): boolean {
  const q = normalizeForumSearchText(query);
  const t = normalizeForumSearchText(term);
  if (!q || !t) {
    return false;
  }

  if (q === t) {
    return true;
  }

  if (hasLatinText(t)) {
    const tokens = tokenizeEnglishText(q);
    if (t.length <= 3) {
      return tokens.includes(t);
    }
    return tokens.some((token) => englishWordFuzzy(token, t)) || q.includes(t);
  }

  if (hasChineseText(t)) {
    return q.includes(t) || t.includes(q);
  }

  return q.includes(t) || t.includes(q);
}

export function expandForumSearchTerms(query: string): string[] {
  const normalized = normalizeForumSearchText(query);
  if (!normalized) {
    return [];
  }

  const terms = new Set<string>([normalized]);
  for (const token of tokenizeEnglishText(normalized)) {
    terms.add(token);
  }

  for (const cluster of FORUM_SEARCH_TERM_CLUSTERS) {
    const clusterHit = cluster.some((member) => {
      const candidate = normalizeForumSearchText(member);
      if (!candidate) {
        return false;
      }

      if (queryContainsTerm(normalized, candidate) || queryContainsTerm(candidate, normalized)) {
        return true;
      }

      if (hasLatinText(normalized) && hasLatinText(candidate)) {
        return englishTermsRelated(normalized, candidate);
      }

      if (hasChineseText(normalized) || hasChineseText(candidate)) {
        return chineseTermsRelated(normalized, candidate);
      }

      return false;
    });

    if (clusterHit) {
      for (const member of cluster) {
        terms.add(normalizeForumSearchText(member));
      }
    }
  }

  return [...terms];
}

function englishTermsRelated(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }

  if (queryContainsTerm(a, b) || queryContainsTerm(b, a)) {
    return true;
  }

  if (a.length >= 3 && b.startsWith(a)) {
    return true;
  }

  if (b.length >= 3 && a.startsWith(b)) {
    return true;
  }

  const tokensA = tokenizeEnglishText(a);
  const tokensB = tokenizeEnglishText(b);
  return tokensA.some((tokenA) =>
    tokensB.some((tokenB) => tokenA === tokenB || englishWordFuzzy(tokenA, tokenB)),
  );
}

function chineseTermsRelated(a: string, b: string): boolean {
  if (a === b || a.includes(b) || b.includes(a)) {
    return true;
  }

  const charsA = [...new Set([...a])];
  const shared = charsA.filter((char) => b.includes(char)).length;
  const threshold = a.length <= 2 ? 0.5 : a.length <= 3 ? 0.67 : 0.5;
  return shared / Math.max(charsA.length, 1) >= threshold;
}

export function englishWordFuzzy(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  if (a.length >= 3 && b.startsWith(a)) {
    return true;
  }

  if (b.length >= 3 && a.startsWith(b)) {
    return true;
  }

  if (a.length >= 4 && b.includes(a)) {
    return true;
  }

  if (b.length >= 4 && a.includes(b)) {
    return true;
  }

  return false;
}
