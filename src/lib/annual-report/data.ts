import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 年度の開始日・終了日を計算する
 * @param fiscalYear 年度（例: 2025 → 2025/4/1〜2026/3/31）
 */
export function getFiscalYearRange(fiscalYear: number): {
  start: string;
  end: string;
} {
  return {
    start: `${fiscalYear}-04-01`,
    end: `${fiscalYear + 1}-03-31`,
  };
}

/**
 * 対象年度の最終月（3月）以降かどうかを判定する
 * 例: 2025年度 → 2026-03-01 以降なら生成可能
 */
export function canGenerate(fiscalYear: number, now: Date = new Date()): boolean {
  const enableDate = new Date(fiscalYear + 1, 2, 1); // 3月1日 (month=2)
  return now >= enableDate;
}

/**
 * 前回生成から24時間以内かどうかを判定する
 */
export function isInCooldown(generatedAt: string, now: Date = new Date()): boolean {
  const generated = new Date(generatedAt);
  const diff = now.getTime() - generated.getTime();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  return diff < TWENTY_FOUR_HOURS;
}

/**
 * クールダウン残り時間（ミリ秒）を返す。クールダウン外なら0。
 */
export function getCooldownRemaining(generatedAt: string, now: Date = new Date()): number {
  const generated = new Date(generatedAt);
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const remaining = TWENTY_FOUR_HOURS - (now.getTime() - generated.getTime());
  return Math.max(0, remaining);
}

/**
 * 各月の最新写真パスを取得する
 * @returns Map<month(1-12), photo_storage_path>
 */
export async function getMonthlyPhotoPaths(
  supabase: SupabaseClient,
  childId: string,
  start: string,
  end: string,
): Promise<Map<number, string>> {
  const { data } = await supabase
    .from("daily_logs")
    .select("log_date, photo_storage_path")
    .eq("child_id", childId)
    .gte("log_date", start)
    .lte("log_date", end)
    .not("photo_storage_path", "is", null)
    .order("log_date", { ascending: false });

  const monthPhotos = new Map<number, string>();
  if (!data) return monthPhotos;

  for (const row of data) {
    const month = new Date(row.log_date).getMonth() + 1; // 1-12
    if (!monthPhotos.has(month)) {
      monthPhotos.set(month, row.photo_storage_path as string);
    }
  }

  return monthPhotos;
}

/**
 * 成長データサマリーを取得する（年度開始時点・終了時点に最も近い記録）
 */
export async function getGrowthSummary(
  supabase: SupabaseClient,
  childId: string,
  start: string,
  end: string,
): Promise<{
  startHeight: number | null;
  endHeight: number | null;
  startWeight: number | null;
  endWeight: number | null;
} | null> {
  // 年度開始に最も近い記録
  const { data: startData } = await supabase
    .from("growth_records")
    .select("height_cm, weight_kg")
    .eq("child_id", childId)
    .gte("measured_date", start)
    .lte("measured_date", end)
    .order("measured_date", { ascending: true })
    .limit(1)
    .single();

  // 年度終了に最も近い記録
  const { data: endData } = await supabase
    .from("growth_records")
    .select("height_cm, weight_kg")
    .eq("child_id", childId)
    .gte("measured_date", start)
    .lte("measured_date", end)
    .order("measured_date", { ascending: false })
    .limit(1)
    .single();

  if (!startData && !endData) return null;

  return {
    startHeight: startData?.height_cm ?? null,
    endHeight: endData?.height_cm ?? null,
    startWeight: startData?.weight_kg ?? null,
    endWeight: endData?.weight_kg ?? null,
  };
}
