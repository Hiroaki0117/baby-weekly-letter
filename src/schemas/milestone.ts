import { z } from "zod";

export const milestoneSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(100, "タイトルは100文字以内で入力してください"),
  milestone_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "無効な日付形式です"),
  category: z.enum(["motor", "language", "eating", "lifestyle", "other"]),
  memo: z
    .string()
    .max(500, "メモは500文字以内で入力してください")
    .optional()
    .or(z.literal("")),
});

export type MilestoneFormValues = z.infer<typeof milestoneSchema>;
