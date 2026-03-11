import { z } from "zod";

export const sleepRecordSchema = z.object({
  sleep_date: z.string().min(1, "日付を入力してください"),
  started_at: z.string().min(1, "就寝時刻を入力してください"),
  ended_at: z.string().min(1, "起床時刻を入力してください"),
});

export type SleepRecordFormValues = z.infer<typeof sleepRecordSchema>;
