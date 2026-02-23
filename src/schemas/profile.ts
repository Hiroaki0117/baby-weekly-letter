import { z } from "zod/v4";

export const profileFormSchema = z.object({
  display_name: z
    .string()
    .max(30, "表示名は30文字以内で入力してください")
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const childFormSchema = z.object({
  name: z.string().max(50, "名前は50文字以内で入力してください").optional(),
  birth_date: z.string().optional(),
});

export type ChildFormValues = z.infer<typeof childFormSchema>;
