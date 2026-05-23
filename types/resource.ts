import { type ContentStatus } from "@/constants/contentStatus";
import { type ResourceCategoryId } from "@/constants/categories";

export type ResourceCategory = {
  id: ResourceCategoryId;
  label: string;
  sortOrder: number;
};

export type Resource = {
  id: string;
  categoryId: ResourceCategoryId;
  title: string;
  description: string | null;
  url: string;
  iconUrl: string | null;
  sortOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type ResourceGroup = ResourceCategory & {
  resources: Resource[];
};

export type ResourceFilters = {
  categoryId?: ResourceCategoryId;
  search?: string;
};
