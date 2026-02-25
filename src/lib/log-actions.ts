import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * ログを削除する（写真がある場合はStorageからも削除）
 * @returns エラーメッセージ（成功時は null）
 */
export async function deleteLog(
  supabase: SupabaseClient<Database>,
  id: string,
  photoStoragePath: string | null
): Promise<string | null> {
  // 写真がある場合はStorageから削除
  if (photoStoragePath) {
    await supabase.storage.from("log-photos").remove([photoStoragePath]);
  }

  // DBレコードを削除
  const { error } = await supabase.from("daily_logs").delete().eq("id", id);

  if (error) {
    return "削除に失敗しました";
  }

  return null;
}
