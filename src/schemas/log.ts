import { z } from "zod";

export const logFormSchema = z.object({
  child_id: z.string().min(1, "お子さまを選択してください"),
  text: z
    .string()
    .min(1, "今日の出来事を入力してください")
    .max(2000, "2000文字以内で入力してください"),
  mood: z.enum(["moved", "happy", "neutral", "tired", "sad"], {
    message: "気分を選択してください",
  }),
  categories: z.array(z.string()),
  log_date: z.string(),
});

export type LogFormValues = z.infer<typeof logFormSchema>;
