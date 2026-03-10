import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Milestone } from "@/types";

type Client = SupabaseClient<Database>;

/**
 * ログIDリストに紐づくマイルストーンをマップで取得
 */
export async function fetchMilestonesByLogIds(
  supabase: Client,
  logIds: string[]
): Promise<Record<string, Milestone>> {
  if (logIds.length === 0) return {};

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .in("daily_log_id", logIds);

  if (error) throw error;

  const map: Record<string, Milestone> = {};
  for (const row of (data ?? []) as Milestone[]) {
    if (row.daily_log_id) {
      map[row.daily_log_id] = row;
    }
  }
  return map;
}

/**
 * マイルストーンを追加
 */
export async function createMilestone(
  supabase: Client,
  data: {
    child_id: string;
    daily_log_id: string;
    title: string;
    milestone_date: string;
  }
): Promise<Milestone> {
  const { data: row, error } = await supabase
    .from("milestones")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return row as Milestone;
}

/**
 * マイルストーンを更新
 */
export async function updateMilestone(
  supabase: Client,
  id: string,
  data: {
    title?: string;
    milestone_date?: string;
  }
): Promise<Milestone> {
  const { data: row, error } = await supabase
    .from("milestones")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return row as Milestone;
}

/**
 * マイルストーンを削除
 */
export async function deleteMilestone(
  supabase: Client,
  id: string
): Promise<void> {
  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) throw error;
}
