import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * 現在のユーザーが所属する family_id を取得する。
 * RLS により auth.uid() のレコードのみ返るため user_id 指定は不要。
 */
export async function getMyFamilyId(
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  const { data } = await supabase
    .from("family_members")
    .select("family_id")
    .single();
  return data?.family_id ?? null;
}
