import { type AdminActionState } from "@/lib/admin/state";
import { type AnnouncementFormValues } from "@/lib/announcements/form";

export type AnnouncementFormState = AdminActionState & {
  fieldErrors?: Record<string, string>;
  values?: AnnouncementFormValues;
  announcementId?: string;
};

