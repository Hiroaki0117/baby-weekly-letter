import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { MealRecord, MealRecordInsert } from "@/types";

type Client = SupabaseClient<Database>;

/**
 * 食事記録を取得
 */
export async function fetchMealRecords(
  supabase: Client,
  childId: string,
): Promise<MealRecord[]> {
  const { data, error } = await supabase
    .from("meal_records")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as MealRecord[]) ?? [];
}

/**
 * 食事記録を追加
 */
export async function addMealRecord(
  supabase: Client,
  record: MealRecordInsert,
): Promise<MealRecord> {
  const { data, error } = await supabase
    .from("meal_records")
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data as MealRecord;
}

/**
 * 食事記録を更新
 */
export async function updateMealRecord(
  supabase: Client,
  id: string,
  record: {
    meal_date?: string;
    meal_type?: string;
    amount?: string;
  },
): Promise<MealRecord> {
  const { data, error } = await supabase
    .from("meal_records")
    .update(record)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as MealRecord;
}

/**
 * 食事記録を削除
 */
export async function deleteMealRecord(
  supabase: Client,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("meal_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
