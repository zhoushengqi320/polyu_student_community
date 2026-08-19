import { z } from "zod";
import { FOOD_AREAS } from "@/constants/categories";
import { FOOD_CATEGORIES } from "@/constants/foodCategories";

const foodAreaIds = FOOD_AREAS.map((item) => item.id) as [string, ...string[]];
const foodCategoryIds = FOOD_CATEGORIES.map((item) => item.id) as [
  string,
  ...string[],
];

const ratingSchema = z.preprocess((value) => {
  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }
  return value;
}, z.number().int().min(1, "评分至少 1 分").max(5, "评分最多 5 分"));

export const foodRecommendationSchema = z.object({
  placeId: z.string().uuid("无效的地点"),
  rating: ratingSchema,
  content: z
    .string()
    .trim()
    .min(10, "推荐内容至少 10 个字")
    .max(2000, "推荐内容最多 2000 字"),
});

export const foodPlaceSubmitSchema = z.object({
  name: z.string().trim().min(2, "店名至少 2 个字").max(100),
  area: z.enum(foodAreaIds, { message: "请选择地区" }),
  category: z.enum(foodCategoryIds, { message: "请选择分类" }),
  address: z.preprocess((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }, z.string().max(200).nullable()),
  tags: z.preprocess((raw) => {
    if (typeof raw !== "string") return [];
    return [
      ...new Set(
        raw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ].slice(0, 10);
  }, z.array(z.string().max(20))),
  rating: ratingSchema,
  content: z
    .string()
    .trim()
    .min(10, "推荐内容至少 10 个字")
    .max(2000, "推荐内容最多 2000 字"),
});

export type FoodRecommendationFormValues = z.infer<
  typeof foodRecommendationSchema
>;
export type FoodPlaceSubmitFormValues = z.infer<typeof foodPlaceSubmitSchema>;
