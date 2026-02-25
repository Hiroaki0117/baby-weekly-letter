import { z } from "zod";

export const generateReportSchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "無効な日付形式です"),
  weekEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "無効な日付形式です"),
  childId: z.string().min(1, "子供IDが必要です"),
});

export type GenerateReportValues = z.infer<typeof generateReportSchema>;
