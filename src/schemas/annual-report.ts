import { z } from "zod";

export const generateAnnualReportSchema = z.object({
  fiscalYear: z
    .number()
    .int()
    .min(2020, "無効な年度です")
    .max(2099, "無効な年度です"),
  childId: z.string().min(1, "子供IDが必要です"),
});

export type GenerateAnnualReportValues = z.infer<
  typeof generateAnnualReportSchema
>;
