import { z } from "zod";

export const mealRecordSchema = z.object({
  meal_date: z.string().min(1, "日付を入力してください"),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"], {
    message: "食事種別を選択してください",
  }),
  amount: z.enum(["plenty", "normal", "little", "none"], {
    message: "量を選択してください",
  }),
});

export type MealRecordFormValues = z.infer<typeof mealRecordSchema>;
