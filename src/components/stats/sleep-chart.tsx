"use client";

import { useMemo, useState } from "react";
import { startOfWeek, addWeeks, addDays, isAfter, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { SleepRecord } from "@/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "yyyy年M月d日")}〜${format(weekEnd, "M月d日")}`;
}

function formatHourMin(minutes: number): string {
  if (minutes === 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

type Props = {
  records: SleepRecord[];
};

export function SleepChart({ records }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const currentMonday = getMonday(new Date());
  const canGoNext = !isAfter(addWeeks(weekStart, 1), currentMonday);

  const days = useMemo(() => {
    const result: { dateStr: string; label: string; dayOfWeek: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      result.push({
        dateStr: format(day, "yyyy-MM-dd"),
        label: `${format(day, "M/d")}(${WEEKDAYS[day.getDay()]})`,
        dayOfWeek: day.getDay(),
      });
    }
    return result;
  }, [weekStart]);

  // 日付ごとに夜間・日中の合計分数を集計
  const grid = useMemo(() => {
    const map = new Map<string, { night: number; daytime: number }>();
    for (const day of days) {
      map.set(day.dateStr, { night: 0, daytime: 0 });
    }
    for (const r of records) {
      const entry = map.get(r.sleep_date);
      if (!entry) continue;
      if (r.sleep_category === "night") {
        entry.night += r.duration_minutes;
      } else {
        entry.daytime += r.duration_minutes;
      }
    }
    return map;
  }, [records, days]);

  const hasData = Array.from(grid.values()).some(
    (v) => v.night + v.daytime > 0,
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">睡眠時間の推移</h3>
        <div className="flex h-8 items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addWeeks(prev, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ‹
          </button>
          <span className="text-sm font-semibold text-foreground">
            {formatWeekLabel(weekStart)}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
            disabled={!canGoNext}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors",
              canGoNext
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "text-muted-foreground/30 cursor-not-allowed",
            )}
          >
            ›
          </button>
        </div>
      </div>

      {/* 凡例 */}
      <div className="mx-auto grid w-fit grid-cols-2 gap-x-6 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-indigo-400" />
          <span className="text-xs text-muted-foreground">夜間睡眠</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-400" />
          <span className="text-xs text-muted-foreground">日中睡眠</span>
        </div>
      </div>

      {!hasData ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          この週の睡眠記録がありません
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                  日付
                </th>
                <th className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  夜間
                </th>
                <th className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  日中
                </th>
                <th className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  合計
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const entry = grid.get(day.dateStr) ?? {
                  night: 0,
                  daytime: 0,
                };
                const total = entry.night + entry.daytime;
                const isWeekend =
                  day.dayOfWeek === 0 || day.dayOfWeek === 6;
                return (
                  <tr
                    key={day.dateStr}
                    className={cn(
                      "border-t border-border/30",
                      isWeekend && "bg-muted/30",
                    )}
                  >
                    <td className="px-2 py-2 text-xs font-medium text-foreground whitespace-nowrap">
                      {day.label}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {entry.night > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                          {formatHourMin(entry.night)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          ー
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {entry.daytime > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                          {formatHourMin(entry.daytime)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          ー
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {total > 0 ? (
                        <span className="text-xs font-bold text-foreground">
                          {formatHourMin(total)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          ー
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
