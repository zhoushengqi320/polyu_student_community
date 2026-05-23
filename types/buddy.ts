import { type BuddyActivityTypeId } from "@/constants/categories";
import { type ContentStatus } from "@/constants/contentStatus";
import { type ProfileListItem } from "@/types/user";

export type BuddyPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  activityType: BuddyActivityTypeId;
  activityAt: string | null;
  location: string | null;
  maxMembers: number | null;
  status: ContentStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BuddyPostListItem = Pick<
  BuddyPost,
  | "id"
  | "title"
  | "activityType"
  | "activityAt"
  | "location"
  | "maxMembers"
  | "createdAt"
> & {
  author: ProfileListItem;
};

export type BuddyPostDetail = BuddyPost & {
  author: ProfileListItem;
};

export type BuddyFilters = {
  activityType?: BuddyActivityTypeId;
  search?: string;
  page?: number;
  pageSize?: number;
};
