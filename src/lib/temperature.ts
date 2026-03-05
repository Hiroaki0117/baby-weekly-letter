import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TemperatureRecord, TemperatureRecordInsert } from "@/types";

type Client = SupabaseClient<Database>;

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
  record: { measured_at: string; temperature: number }
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
