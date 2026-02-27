import { differenceInMonths, differenceInDays, parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { GrowthRecord, GrowthRecordInsert } from "@/types";

type Client = SupabaseClient<Database>;

/**
 * 成長記録を取得（計測日順）
 */
export async function fetchGrowthRecords(
  supabase: Client,
  childId: string
): Promise<GrowthRecord[]> {
  const { data, error } = await supabase
    .from("growth_records")
    .select("*")
    .eq("child_id", childId)
    .order("measured_date", { ascending: true });

  if (error) throw error;
  return (data as GrowthRecord[]) ?? [];
}

/**
 * 成長記録を追加
 */
export async function addGrowthRecord(
  supabase: Client,
  record: GrowthRecordInsert
): Promise<GrowthRecord> {
  const { data, error } = await supabase
    .from("growth_records")
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data as GrowthRecord;
}

/**
 * 成長記録を更新
 */
export async function updateGrowthRecord(
  supabase: Client,
  id: string,
  record: Partial<GrowthRecordInsert>
): Promise<GrowthRecord> {
  const { data, error } = await supabase
    .from("growth_records")
    .update(record)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as GrowthRecord;
}

/**
 * 成長記録を削除
 */
export async function deleteGrowthRecord(
  supabase: Client,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("growth_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * 月齢を計算（小数点1桁）
 * 例: 生後3.5ヶ月 → 3.5
 */
export function calcMonthAge(birthDate: string, measuredDate: string): number {
  const birth = parseISO(birthDate);
  const measured = parseISO(measuredDate);
  const months = differenceInMonths(measured, birth);
  const daysAfterMonth = differenceInDays(
    measured,
    new Date(birth.getFullYear(), birth.getMonth() + months, birth.getDate())
  );
  const daysInMonth = 30.44; // 平均月日数
  return Math.round((months + daysAfterMonth / daysInMonth) * 10) / 10;
}
