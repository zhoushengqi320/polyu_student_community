import { ANNOUNCEMENT_STATUS } from "@/constants/announcements";
import { CONTENT_STATUS } from "@/constants/contentStatus";
import { type AdminAnnouncement } from "@/types/announcement";

export type AnnouncementFormValues = {
  announcementId?: string;
  title: string;
  body: string;
  linkUrl: string;
  linkLabel: string;
  category: "activity" | "maintenance" | "update" | "general";
  importance: "normal" | "important";
  isPinned: boolean;
  scheduleDelay: boolean;
  publishedAt: string;
  endsAt: string;
  publishedEditMode?: boolean;
};

function readBooleanField(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export function createEmptyAnnouncementFormValues(): AnnouncementFormValues {
  return {
    title: "",
    body: "",
    linkUrl: "",
    linkLabel: "",
    category: "general",
    importance: "normal",
    isPinned: false,
    scheduleDelay: false,
    publishedAt: "",
    endsAt: "",
    publishedEditMode: false,
  };
}

export function announcementToFormValues(
  announcement: AdminAnnouncement,
): AnnouncementFormValues {
  const isPublishedEdit = announcement.status === CONTENT_STATUS.published;

  return {
    announcementId: announcement.id,
    title: announcement.title,
    body: announcement.body,
    linkUrl: announcement.linkUrl ?? "",
    linkLabel: announcement.linkLabel ?? "",
    category: announcement.category,
    importance: announcement.importance,
    isPinned: announcement.isPinned,
    scheduleDelay: announcement.status === ANNOUNCEMENT_STATUS.scheduled,
    publishedAt: announcement.publishedAt ?? "",
    endsAt: announcement.endsAt ?? "",
    publishedEditMode: isPublishedEdit,
  };
}

export function extractAnnouncementFormValues(
  formData: FormData,
): AnnouncementFormValues {
  const category = String(formData.get("category") ?? "general");
  const importance = String(formData.get("importance") ?? "normal");

  return {
    announcementId: String(formData.get("announcementId") ?? "") || undefined,
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    linkUrl: String(formData.get("linkUrl") ?? ""),
    linkLabel: String(formData.get("linkLabel") ?? ""),
    category:
      category === "activity" ||
      category === "maintenance" ||
      category === "update" ||
      category === "general"
        ? category
        : "general",
    importance:
      importance === "important" ? "important" : "normal",
    isPinned: readBooleanField(formData, "isPinned"),
    scheduleDelay: readBooleanField(formData, "scheduleDelay"),
    publishedAt: String(formData.get("publishedAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    publishedEditMode: readBooleanField(formData, "publishedEditMode"),
  };
}
