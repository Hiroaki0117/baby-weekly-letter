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
 * 時刻文字列（HH:mm）と日付から timestamptz 用の ISO 文字列を構築する。
 * 就寝時刻 > 起床時刻の場合、起床は翌日として扱う。
 */
export function buildTimestamps(
  sleepDate: string,
  startTime: string,
  endTime: string,
): { startedAt: string; endedAt: string } {
  const startedAt = `${sleepDate}T${startTime}:00`;
  let endDate = sleepDate;
  if (endTime <= startTime) {
    // 日またぎ: 起床は翌日
    const next = new Date(sleepDate);
    next.setDate(next.getDate() + 1);
    endDate = next.toISOString().split("T")[0];
  }
  const endedAt = `${endDate}T${endTime}:00`;
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
