"use client";

import { getCalendarDays, formatMonthJa, toDateString } from "@/lib/date";
import { CalendarDayCell } from "./calendar-day-cell";
import type { DailyLog } from "@/types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarGridProps = {
  year: number;
  month: number;
  logsByDate: Record<string, DailyLog[]>;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function CalendarGrid({
  year,
  month,
  logsByDate,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const days = getCalendarDays(year, month);
  const currentMonth = new Date(year, month);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      {/* ヘッダー: 年月 + 前月/次月 */}
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-5 py-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ‹
        </button>
        <h2 className="font-mincho text-sm font-semibold tracking-wide text-foreground">
          {formatMonthJa(year, month)}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ›
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-border/30 bg-muted/15 px-2 py-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-px bg-border/20 p-1.5">
        {days.map((date) => {
          const dateStr = toDateString(date);
          const logs = logsByDate[dateStr] ?? [];
          return (
            <CalendarDayCell
              key={dateStr}
              date={date}
              currentMonth={currentMonth}
              logs={logs}
              isSelected={selectedDate === dateStr}
              onSelect={(d) => onSelectDate(toDateString(d))}
            />
          );
        })}
      </div>
    </div>
  );
}
