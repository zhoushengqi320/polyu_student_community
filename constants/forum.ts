export const FORUM_CATEGORIES = [
  { id: "course_help", label: "Course Help" },
  { id: "exam_preparation", label: "Exam Preparation" },
  { id: "internship_ra", label: "Internship / RA" },
  { id: "housing", label: "Housing" },
  { id: "second_hand", label: "Second-hand" },
  { id: "campus_life", label: "Campus Life" },
  { id: "lost_and_found", label: "Lost and Found" },
  { id: "general_discussion", label: "General Discussion" },
] as const;

export type ForumCategoryId = (typeof FORUM_CATEGORIES)[number]["id"];

export const FORUM_TOPIC_SUGGESTIONS = [
  "Course Help",
  "Exam Preparation",
  "Internship / RA",
  "Housing",
  "Second-hand",
  "Campus Life",
  "Lost and Found",
  "General Discussion",
  "AMA3724",
  "COMP",
  "DSAI",
  "Food",
  "Hall",
] as const;

export const FORUM_SORT_OPTIONS = [
  { id: "latest", label: "最新" },
  { id: "hot", label: "热度" },
  { id: "most_commented", label: "评论最多" },
  { id: "most_liked", label: "点赞最多" },
  { id: "most_viewed", label: "浏览最多" },
] as const;

export type ForumSortId = (typeof FORUM_SORT_OPTIONS)[number]["id"];

export const FORUM_PAGE_SIZE = 20;
export const FORUM_MAX_TOPICS = 5;
export const FORUM_MAX_TOPIC_LENGTH = 30;

export const FORUM_DESCRIPTION =
  "课程求助、考试复习、实习 RA、租房二手、校园生活都可以在这里讨论";

export function isForumCategoryId(value: string): value is ForumCategoryId {
  return FORUM_CATEGORIES.some((item) => item.id === value);
}

export function isForumSortId(value: string): value is ForumSortId {
  return FORUM_SORT_OPTIONS.some((item) => item.id === value);
}

export function getForumCategoryLabel(categoryId: string | null): string | null {
  if (!categoryId) {
    return null;
  }

  return FORUM_CATEGORIES.find((item) => item.id === categoryId)?.label ?? categoryId;
}

export function buildForumUrl(params: {
  q?: string;
  topic?: string;
  category?: string;
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
  if (params.category) {
    search.set("category", params.category);
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
