import { z } from "zod";
import { BUDDY_ACTIVITY_TYPES } from "@/constants/categories";

const activityTypeIds = BUDDY_ACTIVITY_TYPES.map((item) => item.id) as [
  string,
  ...string[],
];

export const buddyPostSchema = z.object({
  title: z.string().min(2, "标题至少 2 个字").max(120),
  content: z.string().min(10, "内容至少 10 个字").max(5000),
  activityType: z.enum(activityTypeIds),
  activityAt: z.string().datetime().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  maxMembers: z.number().int().min(2).max(100).optional().nullable(),
});

export type BuddyPostFormValues = z.infer<typeof buddyPostSchema>;
