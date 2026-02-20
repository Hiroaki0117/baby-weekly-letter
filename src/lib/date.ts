import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  differenceInMonths,
  differenceInDays,
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

/**
 * 生年月日から月齢を算出
 * 例: "生後6ヶ月", "1歳3ヶ月"
 */
export function calcAge(
  birthDate: string | Date,
  targetDate: Date = new Date()
): string {
  const birth = typeof birthDate === "string" ? parseISO(birthDate) : birthDate;
  const totalMonths = differenceInMonths(targetDate, birth);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years > 0) {
    return months > 0 ? `${years}歳${months}ヶ月` : `${years}歳`;
  }
  if (totalMonths > 0) {
    return `生後${totalMonths}ヶ月`;
  }
  const days = differenceInDays(targetDate, birth);
  return `生後${days}日`;
}

/**
 * 月次カレンダーの日付配列を生成（月曜始まり、6行×7列=42日）
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: calStart, end: calEnd });
}

/**
 * 月次カレンダーの表示範囲（データ取得用）の開始日・終了日を返す
 */
export function getCalendarRange(year: number, month: number) {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  return {
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  };
}

/**
 * 月を "YYYY年M月" 形式でフォーマット
 */
export function formatMonthJa(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}
