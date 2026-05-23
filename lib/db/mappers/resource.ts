import { type ContentStatus } from "@/constants/contentStatus";
import { type ResourceCategoryId } from "@/constants/categories";
import { type Resource, type ResourceCategory } from "@/types/resource";

type ResourceCategoryRow = {
  id: string;
  label: string;
  sort_order: number;
  school_id: string;
  created_at: string;
  updated_at: string;
};

type ResourceRow = {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  url: string;
  icon_url: string | null;
  sort_order: number;
  status: ContentStatus;
  school_id: string;
  created_at: string;
  updated_at: string;
};

export function mapResourceCategory(row: ResourceCategoryRow): ResourceCategory {
  return {
    id: row.id as ResourceCategoryId,
    label: row.label,
    sortOrder: row.sort_order,
  };
}

export function mapResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    categoryId: row.category_id as ResourceCategoryId,
    title: row.title,
    description: row.description,
    url: row.url,
    iconUrl: row.icon_url,
    sortOrder: row.sort_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type { ResourceCategoryRow, ResourceRow };
