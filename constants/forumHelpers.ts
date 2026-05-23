import { FORUM_CATEGORIES, type ForumCategoryId } from "@/constants/categories";

export function getForumCategoryLabel(categoryId: string | null): string | null {
  if (!categoryId) {
    return null;
  }

  const category = FORUM_CATEGORIES.find((item) => item.id === categoryId);
  return category?.label ?? null;
}

export function isForumCategoryId(value: string): value is ForumCategoryId {
  return FORUM_CATEGORIES.some((item) => item.id === value);
}
