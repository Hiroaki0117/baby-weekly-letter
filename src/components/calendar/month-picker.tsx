"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type MonthPickerProps = {
  year: number;
  month: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
};

const MONTH_LABELS = [
  "1月", "2月", "3月",
  "4月", "5月", "6月",
  "7月", "8月", "9月",
  "10月", "11月", "12月",
];

export function MonthPicker({ year, month, onSelect, onClose }: MonthPickerProps) {
  const [displayYear, setDisplayYear] = useState(year);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-50 bg-black/10"
        onClick={onClose}
      />

      {/* ピッカー本体 */}
      <div className="absolute left-0 right-0 top-full z-50 mt-1 mx-4 overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg">
        {/* 年セレクター */}
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setDisplayYear(displayYear - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-foreground">
            {displayYear}年
          </span>
          <button
            type="button"
            onClick={() => setDisplayYear(displayYear + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ›
          </button>
        </div>

        {/* 月グリッド */}
        <div className="grid grid-cols-3 gap-1 p-3">
          {MONTH_LABELS.map((label, i) => {
            const isToday = displayYear === currentYear && i === currentMonth;
            const isCurrent = displayYear === year && i === month;

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelect(displayYear, i);
                  onClose();
                }}
                className={cn(
                  "rounded-lg py-2.5 text-sm transition-all duration-150",
                  "hover:bg-primary/8",
                  "active:scale-95",
                  isCurrent && "bg-primary/12 font-semibold text-primary ring-2 ring-primary/40",
                  isToday && !isCurrent && "font-medium text-primary",
                  !isCurrent && !isToday && "text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
