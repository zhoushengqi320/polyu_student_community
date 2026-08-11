import { type ForumPostListItem } from "@/types/forum";

export type HomeSectionResult<T> = {
  items: T[];
  error?: boolean;
};

export type HomePageData = {
  latestPosts: HomeSectionResult<ForumPostListItem>;
  isDatabaseConfigured: boolean;
};
