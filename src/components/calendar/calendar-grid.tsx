"use client";

import { useState } from "react";
import { getCalendarDays, formatMonthJa, toDateString } from "@/lib/date";
import { CalendarDayCell } from "./calendar-day-cell";
import { MonthPicker } from "./month-picker";
import type { DailyLog, Milestone } from "@/types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarGridProps = {
  year: number;
  month: number;
  logsByDate: Record<string, DailyLog[]>;
  milestoneMap: Record<string, Milestone>;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isCurrentMonth: boolean;
  onGoToToday: () => void;
  onSelectMonth: (year: number, month: number) => void;
};

export function CalendarGrid({
  year,
  month,
  logsByDate,
  milestoneMap,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
  onGoToToday,
  onSelectMonth,
}: CalendarGridProps) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const days = getCalendarDays(year, month);
  const currentMonth = new Date(year, month);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      {/* ヘッダー: 年月 + 前月/次月 + 今月ボタン */}
      <div className="relative flex items-center justify-between border-b border-border/40 bg-muted/30 px-5 py-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          ‹
        </button>

        {/* 中央固定の年月ラベル */}
        <button
          type="button"
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="absolute inset-0 z-0 flex items-center justify-center gap-1"
        >
          <h2 className="font-mincho text-sm font-semibold tracking-wide text-foreground">
            {formatMonthJa(year, month)}
          </h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div className="z-10 flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={onGoToToday}
              className="rounded-md px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10"
            >
              今月
            </button>
          )}
          <button
            type="button"
            onClick={onNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ›
          </button>
        </div>

        {/* 月ピッカー */}
        {showMonthPicker && (
          <MonthPicker
            year={year}
            month={month}
            onSelect={(y, m) => {
              onSelectMonth(y, m);
              setShowMonthPicker(false);
            }}
            onClose={() => setShowMonthPicker(false)}
          />
        )}
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
          const hasMilestone = logs.some((log) => !!milestoneMap[log.id]);
          return (
            <CalendarDayCell
              key={dateStr}
              date={date}
              currentMonth={currentMonth}
              logs={logs}
              isSelected={selectedDate === dateStr}
              onSelect={(d) => onSelectDate(toDateString(d))}
              hasMilestone={hasMilestone}
            />
          );
        })}
      </div>
    </div>
  );
}
