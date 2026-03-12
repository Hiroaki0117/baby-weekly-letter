"use client";

import { useMemo, useState } from "react";
import { startOfWeek, addWeeks, addDays, isAfter, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { SleepRecord, SleepCategory } from "@/types";

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
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

function formatTimeFromISO(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Props = {
  records: SleepRecord[];
};

export function SleepChart({ records }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [popover, setPopover] = useState<{ dateStr: string; category: SleepCategory } | null>(null);

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

  // 日付×カテゴリ → SleepRecord[] のマップ（started_at昇順）
  const detailMap = useMemo(() => {
    const map = new Map<string, SleepRecord[]>();
    for (const r of records) {
      if (!days.some((d) => d.dateStr === r.sleep_date)) continue;
      const key = `${r.sleep_date}_${r.sleep_category}`;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.started_at.localeCompare(b.started_at));
    }
    return map;
  }, [records, days]);

  const hasData = Array.from(grid.values()).some(
    (v) => v.night + v.daytime > 0,
  );

  function togglePopover(dateStr: string, category: SleepCategory) {
    if (popover?.dateStr === dateStr && popover?.category === category) {
      setPopover(null);
    } else {
      setPopover({ dateStr, category });
    }
  }

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
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-400" />
          <span className="text-xs text-muted-foreground">日中睡眠</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-indigo-400" />
          <span className="text-xs text-muted-foreground">夜間睡眠</span>
        </div>
      </div>

      {!hasData ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          この週の睡眠記録がありません
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th className="w-[30%] px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                  日付
                </th>
                <th className="w-[23%] px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  日中
                </th>
                <th className="w-[23%] px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  夜間
                </th>
                <th className="w-[24%] px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  合計
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => {
                const entry = grid.get(day.dateStr) ?? {
                  night: 0,
                  daytime: 0,
                };
                const total = entry.night + entry.daytime;
                const isWeekend =
                  day.dayOfWeek === 0 || day.dayOfWeek === 6;
                const openUpward = dayIndex >= days.length - 2;
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
                    {/* 日中 */}
                    <td className="relative px-2 py-2 text-center">
                      {entry.daytime > 0 ? (
                        <button
                          type="button"
                          onClick={() => togglePopover(day.dateStr, "daytime")}
                          className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-amber-600"
                        >
                          {formatHourMin(entry.daytime)}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          ー
                        </span>
                      )}
                      {popover?.dateStr === day.dateStr && popover?.category === "daytime" && (
                        <SleepPopover
                          records={detailMap.get(`${day.dateStr}_daytime`) ?? []}
                          openUpward={openUpward}
                        />
                      )}
                    </td>
                    {/* 夜間 */}
                    <td className="relative px-2 py-2 text-center">
                      {entry.night > 0 ? (
                        <button
                          type="button"
                          onClick={() => togglePopover(day.dateStr, "night")}
                          className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-indigo-600"
                        >
                          {formatHourMin(entry.night)}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">
                          ー
                        </span>
                      )}
                      {popover?.dateStr === day.dateStr && popover?.category === "night" && (
                        <SleepPopover
                          records={detailMap.get(`${day.dateStr}_night`) ?? []}
                          openUpward={openUpward}
                        />
                      )}
                    </td>
                    {/* 合計 */}
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

function SleepPopover({ records, openUpward }: { records: SleepRecord[]; openUpward: boolean }) {
  if (records.length === 0) return null;
  return (
    <div
      className={cn(
        "absolute left-1/2 z-10 -translate-x-1/2 rounded-lg border border-border/60 bg-white px-3 py-2 shadow-lg",
        openUpward ? "bottom-full mb-1" : "top-full mt-1",
      )}
    >
      <div className="space-y-1 text-xs whitespace-nowrap">
        {records.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {formatTimeFromISO(r.started_at)}
            </span>
            <span className="text-muted-foreground">〜</span>
            <span className="text-muted-foreground">
              {formatTimeFromISO(r.ended_at)}
            </span>
            <span className="font-medium text-foreground">
              {formatHourMin(r.duration_minutes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
