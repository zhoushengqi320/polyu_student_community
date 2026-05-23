import { z } from "zod";
import { FORUM_CATEGORIES } from "@/constants/categories";

const forumCategoryIds = FORUM_CATEGORIES.map((item) => item.id) as [
  string,
  ...string[],
];

export const postSchema = z.object({
  title: z.string().min(2, "标题至少 2 个字").max(120),
  content: z.string().min(10, "内容至少 10 个字").max(10000),
  categoryId: z.enum(forumCategoryIds),
});

export type PostFormValues = z.infer<typeof postSchema>;
