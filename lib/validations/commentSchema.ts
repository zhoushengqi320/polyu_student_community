import { z } from "zod";

export const commentSchema = z.object({
  targetType: z.string().min(1),
  targetId: z.string().uuid(),
  content: z.string().min(1, "评论不能为空").max(2000),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
