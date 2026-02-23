import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * 現在のユーザーが所属する family_id を取得する。
 * SECURITY DEFINER の my_family_id() RPC を直接呼び、RLS を経由しない。
 */
export async function getMyFamilyId(
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  const { data } = await supabase.rpc("my_family_id");
  return (data as string | null) ?? null;
}
