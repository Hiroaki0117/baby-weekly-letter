import { z } from "zod";

export const commentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "コメントを入力してください")
    .max(100, "100文字以内で入力してください"),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
