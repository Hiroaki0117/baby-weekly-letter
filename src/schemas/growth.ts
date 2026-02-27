import { z } from "zod";

export const growthRecordSchema = z
  .object({
    measured_date: z.string().min(1, "計測日を入力してください"),
    height_cm: z
      .number()
      .min(20, "20cm以上で入力してください")
      .max(200, "200cm以下で入力してください")
      .nullable(),
    weight_kg: z
      .number()
      .min(0.5, "0.5kg以上で入力してください")
      .max(100, "100kg以下で入力してください")
      .nullable(),
  })
  .refine((data) => data.height_cm !== null || data.weight_kg !== null, {
    message: "身長か体重のいずれかを入力してください",
  });

export type GrowthRecordFormValues = z.infer<typeof growthRecordSchema>;
