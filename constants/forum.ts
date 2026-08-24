export const FORUM_TOPIC_SUGGESTIONS = [
  "课程求助",
  "考试复习",
  "实习/RA",
  "租房",
  "二手",
  "校园生活",
  "失物招领",
  "自由讨论",
  "找搭子",
  "AMA3724",
  "COMP",
  "DSAI",
  "美食",
  "宿舍",
] as const;

export const FORUM_SORT_OPTIONS = [
  { id: "latest", label: "最新" },
  { id: "most_commented", label: "评论最多" },
  { id: "most_liked", label: "点赞最多" },
  { id: "most_viewed", label: "浏览最多" },
] as const;

export type ForumSortId = (typeof FORUM_SORT_OPTIONS)[number]["id"];

export const FORUM_PAGE_SIZE = 20;
export const FORUM_MAX_TOPICS = 5;
export const FORUM_MAX_TOPIC_LENGTH = 30;
export const FORUM_POPULAR_TOPICS_LIMIT = 10;
/** 模糊搜索时最多拉取帖子数（内存排序后再分页） */
export const FORUM_SEARCH_FETCH_LIMIT = 500;

export const FORUM_DESCRIPTION =
  "课程求助、考试复习、实习 RA、租房二手、找搭子、校园生活都可以在这里讨论。找学习搭子、约饭、组队或室友，请带上「找搭子」话题。";

/** 热度 = 点赞×3 + 评论×5 + 浏览×1（浏览仅进入详情页后累计） */
export const FORUM_HOT_SCORE_WEIGHTS = {
  like: 3,
  comment: 5,
  view: 1,
} as const;

export function computeForumPostHotScore(input: {
  likeCount: number;
  commentCount: number;
  viewCount: number;
}): number {
  return (
    input.likeCount * FORUM_HOT_SCORE_WEIGHTS.like +
    input.commentCount * FORUM_HOT_SCORE_WEIGHTS.comment +
    input.viewCount * FORUM_HOT_SCORE_WEIGHTS.view
  );
}

export function isForumSortId(value: string): value is ForumSortId {
  return FORUM_SORT_OPTIONS.some((item) => item.id === value);
}

/** 兼容旧链接 ?sort=hot */
export function normalizeForumSort(value: string | undefined): ForumSortId {
  if (value === "hot") {
    return "most_viewed";
  }
  if (value && isForumSortId(value)) {
    return value;
  }
  return "latest";
}

export function buildForumUrl(params: {
  q?: string;
  topic?: string;
  sort?: ForumSortId;
  page?: number;
}) {
  const search = new URLSearchParams();

  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }
  if (params.topic?.trim()) {
    search.set("topic", params.topic.trim());
  }
  if (params.sort && params.sort !== "latest") {
    search.set("sort", params.sort);
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  const query = search.toString();
  return query ? `/forum?${query}` : "/forum";
}
