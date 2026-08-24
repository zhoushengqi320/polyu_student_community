import { type ForumPostListItem } from "@/types/forum";
import { type SiteAnnouncement } from "@/types/announcement";

export type HomeSectionResult<T> = {
  items: T[];
  error?: boolean;
};

export type HomePageData = {
  hottestPosts: HomeSectionResult<ForumPostListItem>;
  announcements: SiteAnnouncement[];
  isDatabaseConfigured: boolean;
};
