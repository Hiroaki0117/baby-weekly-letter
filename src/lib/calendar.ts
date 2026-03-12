import { format, startOfMonth, endOfMonth, addDays, getDay } from "date-fns";

/**
 * 月曜始まりのカレンダーグリッドを生成する。
 * 週ごとの配列を返し、当月外の日は null。
 */
export function buildCalendarWeeks(
  year: number,
  month: number,
): (string | null)[][] {
  const first = startOfMonth(new Date(year, month, 1));
  const last = endOfMonth(first);

  // 月曜=0, 火=1, ..., 日=6 に変換
  const startDow = (getDay(first) + 6) % 7;

  const weeks: (string | null)[][] = [];
  let currentWeek: (string | null)[] = [];

  // 前月の空白を埋める
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }

  // 当月の日を埋める
  let d = first;
  while (d <= last) {
    currentWeek.push(format(d, "yyyy-MM-dd"));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    d = addDays(d, 1);
  }

  // 最後の週の残りを埋める
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

/** 月ラベル（例: "2026年3月"） */
export function formatMonthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}
