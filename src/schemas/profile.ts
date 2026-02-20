import { z } from "zod/v4";

export const profileFormSchema = z.object({
  child_name: z.string().max(50, "名前は50文字以内で入力してください").optional(),
  child_birth_date: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
