import type { DailyLog, Mood } from "@/types";

export type MonthlyCount = {
  month: string; // "2025/01"
  count: number;
};

export type MonthlyMood = {
  month: string;
  moved: number;
  happy: number;
  neutral: number;
  tired: number;
  sad: number;
};

export type CategoryCount = {
  category: string;
  count: number;
};

const MOODS: Mood[] = ["moved", "happy", "neutral", "tired", "sad"];

function toMonthKey(logDate: string): string {
  // logDate is "YYYY-MM-DD"
  return logDate.slice(0, 4) + "/" + logDate.slice(5, 7);
}

/**
 * 月別の記録件数を昇順で返す
 */
export function calcMonthlyCounts(logs: DailyLog[]): MonthlyCount[] {
  const map = new Map<string, number>();
  for (const log of logs) {
    const key = toMonthKey(log.log_date);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * 月別の気分内訳を昇順で返す
 */
export function calcMonthlyMoods(logs: DailyLog[]): MonthlyMood[] {
  const map = new Map<string, MonthlyMood>();
  for (const log of logs) {
    const key = toMonthKey(log.log_date);
    let entry = map.get(key);
    if (!entry) {
      entry = { month: key, moved: 0, happy: 0, neutral: 0, tired: 0, sad: 0 };
      map.set(key, entry);
    }
    if (MOODS.includes(log.mood as Mood)) {
      entry[log.mood as Mood]++;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
}

/**
 * カテゴリ別の記録件数を降順で返す
 */
export function calcCategoryCounts(logs: DailyLog[]): CategoryCount[] {
  const map = new Map<string, number>();
  for (const log of logs) {
    for (const cat of log.categories) {
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}
