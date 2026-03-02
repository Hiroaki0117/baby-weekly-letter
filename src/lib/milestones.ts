import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Milestone } from "@/types";

type Client = SupabaseClient<Database>;

/**
 * 子供のマイルストーン一覧を取得（新しい順）
 */
export async function fetchMilestones(
  supabase: Client,
  childId: string
): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("child_id", childId)
    .order("milestone_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Milestone[];
}

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
    daily_log_id?: string;
    title: string;
    milestone_date: string;
    category: string;
    memo?: string;
    source?: string;
    weekly_report_id?: string;
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
    category?: string;
    memo?: string | null;
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

/**
 * AI抽出結果を一括保存（重複チェック付き）
 */
export async function saveMilestones(
  supabase: Client,
  childId: string,
  milestones: {
    title: string;
    date: string;
    category: string;
    memo?: string;
  }[],
  weeklyReportId: string
): Promise<{ saved: number; skipped: number }> {
  if (milestones.length === 0) return { saved: 0, skipped: 0 };

  // 既存マイルストーンを取得（重複チェック用）
  const existing = await fetchMilestones(supabase, childId);

  let saved = 0;
  let skipped = 0;

  for (const m of milestones) {
    const isDuplicate = existing.some((e) => {
      // 日付が前後7日以内
      const existingDate = new Date(e.milestone_date).getTime();
      const newDate = new Date(m.date).getTime();
      const diffDays = Math.abs(existingDate - newDate) / (1000 * 60 * 60 * 24);
      if (diffDays > 7) return false;

      // タイトルが類似（一方が他方を含む or 完全一致）
      const eTitle = e.title.toLowerCase();
      const mTitle = m.title.toLowerCase();
      return eTitle === mTitle || eTitle.includes(mTitle) || mTitle.includes(eTitle);
    });

    if (isDuplicate) {
      skipped++;
      continue;
    }

    await createMilestone(supabase, {
      child_id: childId,
      title: m.title,
      milestone_date: m.date,
      category: m.category,
      memo: m.memo,
      source: "ai",
      weekly_report_id: weeklyReportId,
    });
    saved++;
  }

  return { saved, skipped };
}
