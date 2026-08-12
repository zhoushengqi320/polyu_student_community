export type ModuleKey =
  | "courses"
  | "food"
  | "study"
  | "life"
  | "forum"
  | "guides"
  | "feedback";

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type SortOrder = "asc" | "desc";

export type ListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
};

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
