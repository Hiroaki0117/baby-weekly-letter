import { z } from "zod";

export const createFamilySchema = z.object({
  familyName: z
    .string()
    .min(1, "家族名を入力してください")
    .max(50, "家族名は50文字以内で入力してください"),
  displayName: z
    .string()
    .min(1, "表示名を入力してください")
    .max(30, "表示名は30文字以内で入力してください"),
  childName: z.string().max(50, "名前は50文字以内で入力してください").optional(),
  childBirthDate: z.string().optional(),
});

export type CreateFamilyValues = z.infer<typeof createFamilySchema>;

export const joinFamilySchema = z.object({
  token: z.string().min(1, "招待トークンが必要です"),
  displayName: z
    .string()
    .max(30, "表示名は30文字以内で入力してください")
    .optional(),
});

export type JoinFamilyValues = z.infer<typeof joinFamilySchema>;
