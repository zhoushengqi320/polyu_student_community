import {
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_IMPORTANCE,
  type AnnouncementStatus,
} from "@/constants/announcements";

export type AnnouncementCategoryId = keyof typeof ANNOUNCEMENT_CATEGORIES;
export type AnnouncementImportanceId = keyof typeof ANNOUNCEMENT_IMPORTANCE;

export type SiteAnnouncement = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
  category: AnnouncementCategoryId;
  importance: AnnouncementImportanceId;
  isPinned: boolean;
  status: AnnouncementStatus | "draft";
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminAnnouncement = SiteAnnouncement;
