import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SleepRecord, SleepRecordInsert } from "@/types";

type Client = SupabaseClient<Database>;

/**
 * 睡眠時間（分）を計算する。日またぎ対応。
 * @param startedAt ISO 8601 タイムスタンプ
 * @param endedAt ISO 8601 タイムスタンプ
 */
export function calcDurationMinutes(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * ローカルタイムゾーンのオフセット文字列を返す（例: "+09:00", "-05:00"）
 */
function getLocalTzOffset(): string {
  const offset = new Date().getTimezoneOffset(); // 分（UTCとの差、JSTなら -540）
  const sign = offset <= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

/**
 * 時刻文字列（HH:mm）と日付から timestamptz 用の ISO 文字列を構築する。
 * 就寝時刻 > 起床時刻の場合、起床は翌日として扱う。
 * ローカルタイムゾーンオフセットを付与して正しく timestamptz に格納されるようにする。
 */
export function buildTimestamps(
  sleepDate: string,
  startTime: string,
  endTime: string,
): { startedAt: string; endedAt: string } {
  const tz = getLocalTzOffset();
  let endDate = sleepDate;
  if (endTime <= startTime) {
    // 日またぎ: 起床は翌日
    const next = new Date(`${sleepDate}T00:00:00${tz}`);
    next.setDate(next.getDate() + 1);
    const y = next.getFullYear();
    const mo = String(next.getMonth() + 1).padStart(2, "0");
    const d = String(next.getDate()).padStart(2, "0");
    endDate = `${y}-${mo}-${d}`;
  }
  const startedAt = `${sleepDate}T${startTime}:00${tz}`;
  const endedAt = `${endDate}T${endTime}:00${tz}`;
  return { startedAt, endedAt };
}

/**
 * 睡眠記録を取得
 */
export async function fetchSleepRecords(
  supabase: Client,
  childId: string,
): Promise<SleepRecord[]> {
  const { data, error } = await supabase
    .from("sleep_records")
    .select("*")
    .eq("child_id", childId)
    .order("started_at", { ascending: true });

  if (error) throw error;
  return (data as SleepRecord[]) ?? [];
}

/**
 * 睡眠記録を追加
 */
export async function addSleepRecord(
  supabase: Client,
  record: SleepRecordInsert,
): Promise<SleepRecord> {
  const { data, error } = await supabase
    .from("sleep_records")
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data as SleepRecord;
}

/**
 * 睡眠記録を更新
 */
export async function updateSleepRecord(
  supabase: Client,
  id: string,
  record: {
    sleep_date?: string;
    started_at?: string;
    ended_at?: string;
    duration_minutes?: number;
  },
): Promise<SleepRecord> {
  const { data, error } = await supabase
    .from("sleep_records")
    .update(record)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as SleepRecord;
}

/**
 * 睡眠記録を削除
 */
export async function deleteSleepRecord(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("sleep_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
