import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isValid,
} from "date-fns";
import { ja } from "date-fns/locale";

/**
 * 指定日が属する週の月曜〜日曜を返す
 */
export function getWeekRange(date: Date) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * Date を "YYYY-MM-DD" 形式に変換
 */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * "YYYY-MM-DD" 文字列を Date に変換
 */
export function fromDateString(dateStr: string): Date {
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return parsed;
}

/**
 * 日付を日本語表示用にフォーマット
 * 例: "2月18日（水）"
 */
export function formatDateJa(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "M月d日（E）", { locale: ja });
}

/**
 * 日付を "YYYY/MM/DD" 形式にフォーマット
 */
export function formatDateSlash(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy/MM/dd");
}

/**
 * 週の範囲を "YYYY/MM/DD〜YYYY/MM/DD" 形式で返す
 */
export function formatWeekRange(
  weekStart: Date | string,
  weekEnd: Date | string
): string {
  return `${formatDateSlash(weekStart)}〜${formatDateSlash(weekEnd)}`;
}
