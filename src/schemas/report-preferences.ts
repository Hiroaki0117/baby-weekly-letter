import { z } from "zod";

export const reportPreferencesSchema = z.object({
  tone: z.enum(["warm", "humor", "neutral", "poetic"]),
  sections: z
    .array(z.enum(["highlight", "digest", "growth", "encouragement", "quote"]))
    .min(1, "セクションを最低1つ選択してください"),
});

export type ReportPreferencesFormValues = z.infer<typeof reportPreferencesSchema>;
