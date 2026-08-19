export const FOOD_CATEGORIES = [
  { id: "restaurant", label: "餐厅" },
  { id: "snack", label: "小吃" },
  { id: "dessert_drink", label: "甜品饮品" },
  { id: "cafe", label: "咖啡茶饮" },
  { id: "fast_food", label: "快餐" },
  { id: "night_snack", label: "宵夜" },
  { id: "attraction", label: "景点打卡" },
  { id: "activity", label: "活动体验" },
  { id: "sports", label: "运动娱乐" },
  { id: "karaoke", label: "KTV / 聚会" },
  { id: "board_game", label: "桌游 / 密室" },
  { id: "other", label: "其他" },
] as const;

export type FoodCategoryId = (typeof FOOD_CATEGORIES)[number]["id"];

export function getFoodCategoryLabel(id: string): string {
  return FOOD_CATEGORIES.find((item) => item.id === id)?.label ?? id;
}
