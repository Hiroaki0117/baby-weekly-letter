import { z } from "zod";

export const logFormSchema = z.object({
  text: z
    .string()
    .min(1, "今日の出来事を入力してください")
    .max(2000, "2000文字以内で入力してください"),
  mood: z.enum(["happy", "neutral", "sad"], {
    message: "気分を選択してください",
  }),
  categories: z.array(z.string()),
  log_date: z.string(),
});

export type LogFormValues = z.infer<typeof logFormSchema>;
