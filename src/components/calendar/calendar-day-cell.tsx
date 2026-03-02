"use client";

import { cn } from "@/lib/utils";
import { isToday, isSameMonth, getDate } from "date-fns";
import { MOOD_OPTIONS } from "@/types";
import type { DailyLog } from "@/types";

type CalendarDayCellProps = {
  date: Date;
  currentMonth: Date;
  logs: DailyLog[];
  isSelected: boolean;
  onSelect: (date: Date) => void;
  hasMilestone?: boolean;
};

export function CalendarDayCell({
  date,
  currentMonth,
  logs,
  isSelected,
  onSelect,
  hasMilestone,
}: CalendarDayCellProps) {
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const hasLogs = logs.length > 0;
  const firstMood = hasLogs
    ? MOOD_OPTIONS.find((m) => m.value === logs[0].mood)
    : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 min-h-[48px] transition-all duration-150",
        "hover:bg-primary/5",
        !inMonth && "opacity-30",
        isSelected && "bg-primary/12 ring-2 ring-primary/40",
        today && !isSelected && "ring-2 ring-primary/25 bg-primary/5"
      )}
    >
      {/* 日付数字 */}
      <span
        className={cn(
          "text-xs leading-none",
          today
            ? "font-bold text-primary"
            : inMonth
              ? "text-foreground"
              : "text-muted-foreground"
        )}
      >
        {getDate(date)}
      </span>

      {/* 気分 emoji */}
      {hasLogs ? (
        <span className="text-base leading-none">{firstMood?.emoji}</span>
      ) : (
        <span className="h-5" /> /* プレースホルダー */
      )}

      {/* マイルストーンマーク */}
      {hasMilestone && (
        <span className="absolute inset-x-0 bottom-1 flex justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
      )}

      {/* ログ件数バッジ */}
      {hasLogs && (
        <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary/80 text-[8px] font-bold text-primary-foreground">
          {logs.length}
        </span>
      )}
    </button>
  );
}
