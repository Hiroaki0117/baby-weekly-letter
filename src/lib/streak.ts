import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { toDateString } from "@/lib/date";

/**
 * 連続記録日数（ストリーク）を算出する
 * 今日から遡って連続でログがある日数をカウント
 * 今日のログがまだない場合は昨日を起点にする（書き忘れでストリークが途切れない）
 */
export async function getStreak(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const today = new Date();
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data, error } = await supabase
    .from("daily_logs")
    .select("log_date")
    .gte("log_date", toDateString(sixtyDaysAgo))
    .order("log_date", { ascending: false });

  if (error || !data || data.length === 0) return 0;

  // ユニークな日付のSetを作成
  const logDates = new Set(data.map((d) => d.log_date));

  const todayStr = toDateString(today);
  const hasToday = logDates.has(todayStr);

  // 起点: 今日のログがあれば今日から、なければ昨日から
  const start = new Date(today);
  if (!hasToday) {
    start.setDate(start.getDate() - 1);
  }

  let streak = 0;
  const cursor = new Date(start);

  for (let i = 0; i < 60; i++) {
    if (logDates.has(toDateString(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
