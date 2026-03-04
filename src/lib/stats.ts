import { addDays, format } from "date-fns";
import { CATEGORY_OPTIONS } from "@/types";
import type { DailyLog, Mood } from "@/types";

// --- 共通型 ---

export type PeriodType = "weekly" | "monthly" | "yearly";

export type CountEntry = {
  label: string;
  count: number;
};

export type MoodEntry = {
  label: string;
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

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

const MONTH_LABELS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

function emptyMood(label: string): MoodEntry {
  return { label, moved: 0, happy: 0, neutral: 0, tired: 0, sad: 0 };
}

// --- 週別 ---

/**
 * 週別の記録件数（月〜日の7日分）
 */
export function calcWeeklyCounts(logs: DailyLog[], weekStart: Date): CountEntry[] {
  const entries: CountEntry[] = DAY_LABELS.map((label) => ({ label, count: 0 }));
  for (let i = 0; i < 7; i++) {
    const dateStr = format(addDays(weekStart, i), "yyyy-MM-dd");
    entries[i].count = logs.filter((l) => l.log_date === dateStr).length;
  }
  return entries;
}

/**
 * 週別の気分内訳（月〜日の7日分）
 */
export function calcWeeklyMoods(logs: DailyLog[], weekStart: Date): MoodEntry[] {
  const entries: MoodEntry[] = DAY_LABELS.map((label) => emptyMood(label));
  for (let i = 0; i < 7; i++) {
    const dateStr = format(addDays(weekStart, i), "yyyy-MM-dd");
    const dayLogs = logs.filter((l) => l.log_date === dateStr);
    for (const log of dayLogs) {
      if (MOODS.includes(log.mood as Mood)) {
        entries[i][log.mood as Mood]++;
      }
    }
  }
  return entries;
}

// --- 月別 ---

/**
 * 月別の記録件数（指定年の1月〜12月）
 */
export function calcMonthlyCounts(logs: DailyLog[], year: number): CountEntry[] {
  const entries: CountEntry[] = MONTH_LABELS.map((label) => ({ label, count: 0 }));
  for (const log of logs) {
    const logYear = parseInt(log.log_date.slice(0, 4), 10);
    const logMonth = parseInt(log.log_date.slice(5, 7), 10);
    if (logYear === year && logMonth >= 1 && logMonth <= 12) {
      entries[logMonth - 1].count++;
    }
  }
  return entries;
}

/**
 * 月別の気分内訳（指定年の1月〜12月）
 */
export function calcMonthlyMoods(logs: DailyLog[], year: number): MoodEntry[] {
  const entries: MoodEntry[] = MONTH_LABELS.map((label) => emptyMood(label));
  for (const log of logs) {
    const logYear = parseInt(log.log_date.slice(0, 4), 10);
    const logMonth = parseInt(log.log_date.slice(5, 7), 10);
    if (logYear === year && logMonth >= 1 && logMonth <= 12) {
      if (MOODS.includes(log.mood as Mood)) {
        entries[logMonth - 1][log.mood as Mood]++;
      }
    }
  }
  return entries;
}

// --- 年別 ---

/**
 * 年別の記録件数（直近5年分）
 */
export function calcYearlyCounts(logs: DailyLog[]): CountEntry[] {
  const currentYear = new Date().getFullYear();
  const entries: CountEntry[] = [];
  for (let y = currentYear - 4; y <= currentYear; y++) {
    entries.push({ label: String(y), count: 0 });
  }
  for (const log of logs) {
    const logYear = parseInt(log.log_date.slice(0, 4), 10);
    const idx = logYear - (currentYear - 4);
    if (idx >= 0 && idx < 5) {
      entries[idx].count++;
    }
  }
  return entries;
}

/**
 * 年別の気分内訳（直近5年分）
 */
export function calcYearlyMoods(logs: DailyLog[]): MoodEntry[] {
  const currentYear = new Date().getFullYear();
  const entries: MoodEntry[] = [];
  for (let y = currentYear - 4; y <= currentYear; y++) {
    entries.push(emptyMood(String(y)));
  }
  for (const log of logs) {
    const logYear = parseInt(log.log_date.slice(0, 4), 10);
    const idx = logYear - (currentYear - 4);
    if (idx >= 0 && idx < 5) {
      if (MOODS.includes(log.mood as Mood)) {
        entries[idx][log.mood as Mood]++;
      }
    }
  }
  return entries;
}

// --- カテゴリ ---

const categoryLabelMap = new Map(
  CATEGORY_OPTIONS.map((c) => [c.value, c.label])
);

/**
 * カテゴリ別の記録件数を降順で返す（日本語ラベル）
 */
export function calcCategoryCounts(logs: DailyLog[]): CategoryCount[] {
  const map = new Map<string, number>();
  for (const log of logs) {
    for (const cat of log.categories) {
      const label = categoryLabelMap.get(cat) ?? cat;
      map.set(label, (map.get(label) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

function countCategories(logs: DailyLog[]): CategoryCount[] {
  const map = new Map<string, number>();
  for (const log of logs) {
    for (const cat of log.categories) {
      const label = categoryLabelMap.get(cat) ?? cat;
      map.set(label, (map.get(label) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 週別のカテゴリ集計（weekStart〜7日間）
 */
export function calcWeeklyCategoryCounts(logs: DailyLog[], weekStart: Date): CategoryCount[] {
  const dates = new Set<string>();
  for (let i = 0; i < 7; i++) {
    dates.add(format(addDays(weekStart, i), "yyyy-MM-dd"));
  }
  return countCategories(logs.filter((l) => dates.has(l.log_date)));
}

/**
 * 月別のカテゴリ集計（指定年のログのみ）
 */
export function calcMonthlyCategoryCounts(logs: DailyLog[], year: number): CategoryCount[] {
  return countCategories(
    logs.filter((l) => parseInt(l.log_date.slice(0, 4), 10) === year)
  );
}

/**
 * 特定の年月のカテゴリ集計
 */
export function calcSingleMonthCategoryCounts(logs: DailyLog[], year: number, month: number): CategoryCount[] {
  return countCategories(
    logs.filter((l) => {
      const y = parseInt(l.log_date.slice(0, 4), 10);
      const m = parseInt(l.log_date.slice(5, 7), 10);
      return y === year && m === month;
    })
  );
}

/**
 * 年別のカテゴリ集計（直近5年分）
 */
export function calcYearlyCategoryCounts(logs: DailyLog[]): CategoryCount[] {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 4;
  return countCategories(
    logs.filter((l) => {
      const y = parseInt(l.log_date.slice(0, 4), 10);
      return y >= minYear && y <= currentYear;
    })
  );
}
