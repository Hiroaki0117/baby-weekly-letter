import { z } from "zod";

export const temperatureRecordSchema = z.object({
  measured_at: z.string().min(1, "計測日時を入力してください"),
  temperature: z
    .number()
    .min(34.0, "34.0℃以上で入力してください")
    .max(42.0, "42.0℃以下で入力してください"),
});

export type TemperatureRecordFormValues = z.infer<typeof temperatureRecordSchema>;
