import { z } from "zod";
import { FOOD_AREAS } from "@/constants/categories";

const foodAreaIds = FOOD_AREAS.map((item) => item.id) as [string, ...string[]];

export const foodSchema = z.object({
  name: z.string().min(2, "店名至少 2 个字").max(100),
  area: z.enum(foodAreaIds),
  address: z.string().max(200).optional().nullable(),
  rating: z.number().min(1).max(5),
  content: z.string().min(10, "推荐内容至少 10 个字").max(2000),
  tags: z.array(z.string().max(20)).max(10).optional(),
});

export type FoodFormValues = z.infer<typeof foodSchema>;
