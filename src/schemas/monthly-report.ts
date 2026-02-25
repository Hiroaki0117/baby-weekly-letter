import { z } from "zod";

export const generateMonthlyReportSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "無効な月形式です（YYYY-MM）"),
  childId: z.string().min(1, "子供IDが必要です"),
});

export type GenerateMonthlyReportValues = z.infer<
  typeof generateMonthlyReportSchema
>;
