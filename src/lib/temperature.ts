import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TemperatureRecord, TemperatureRecordInsert, TempPeriod } from "@/types";

type Client = SupabaseClient<Database>;

/**
 * 計測時刻（ISO 8601）から時間区分を判定する。
 * JST（UTC+9）で判定:
 *   朝 (morning):   5:00〜9:59
 *   昼 (afternoon): 10:00〜15:59
 *   夕 (evening):   16:00〜19:59
 *   夜 (night):     20:00〜翌4:59
 */
export function classifyTempPeriod(measuredAt: string): TempPeriod {
  const d = new Date(measuredAt);
  const jstHour = (d.getUTCHours() + 9) % 24;
  if (jstHour >= 5 && jstHour < 10) return "morning";
  if (jstHour >= 10 && jstHour < 16) return "afternoon";
  if (jstHour >= 16 && jstHour < 20) return "evening";
  return "night";
}

/**
 * 体温記録を取得（計測日時順）
 */
export async function fetchTemperatureRecords(
  supabase: Client,
  childId: string
): Promise<TemperatureRecord[]> {
  const { data, error } = await supabase
    .from("temperature_records")
    .select("*")
    .eq("child_id", childId)
    .order("measured_at", { ascending: true });

  if (error) throw error;
  return (data as TemperatureRecord[]) ?? [];
}

/**
 * 体温記録を追加
 */
export async function addTemperatureRecord(
  supabase: Client,
  record: TemperatureRecordInsert
): Promise<TemperatureRecord> {
  const { data, error } = await supabase
    .from("temperature_records")
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data as TemperatureRecord;
}

/**
 * 体温記録を更新
 */
export async function updateTemperatureRecord(
  supabase: Client,
  id: string,
  record: { measured_at: string; temperature: number; temp_period?: string }
): Promise<TemperatureRecord> {
  const { data, error } = await supabase
    .from("temperature_records")
    .update(record)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as TemperatureRecord;
}

/**
 * 体温記録を削除
 */
export async function deleteTemperatureRecord(
  supabase: Client,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("temperature_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
