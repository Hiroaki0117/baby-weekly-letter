"use client";

import { useMemo, useState } from "react";
import { startOfWeek, addWeeks, addDays, isAfter, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { TemperatureRecord, TempPeriod } from "@/types";

const FEVER_LINE = 37.5;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const PERIODS: { value: TempPeriod; label: string }[] = [
  { value: "morning", label: "朝" },
  { value: "afternoon", label: "昼" },
  { value: "evening", label: "夕" },
  { value: "night", label: "夜" },
];

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "yyyy年M月d日")}〜${format(weekEnd, "M月d日")}`;
}

function tempStyle(temp: number): { bg: string; text: string } {
  if (temp >= FEVER_LINE) return { bg: "bg-red-100", text: "text-red-700" };
  if (temp >= 37.0) return { bg: "bg-yellow-100", text: "text-yellow-700" };
  if (temp >= 36.0) return { bg: "bg-green-100", text: "text-green-700" };
  return { bg: "bg-blue-100", text: "text-blue-700" };
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Props = {
  records: TemperatureRecord[];
};

export function TemperatureChart({ records }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [popover, setPopover] = useState<{ dateStr: string; period: TempPeriod } | null>(null);

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

  // 日付×区分 → TemperatureRecord[] のマップ（measured_at降順＝最新が先頭）
  const grid = useMemo(() => {
    const map = new Map<string, TemperatureRecord[]>();
    for (const r of records) {
      const dateStr = format(new Date(r.measured_at), "yyyy-MM-dd");
      if (!days.some((d) => d.dateStr === dateStr)) continue;
      const key = `${dateStr}_${r.temp_period}`;
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    // 各セル内を最新順にソート
    for (const arr of map.values()) {
      arr.sort((a, b) => b.measured_at.localeCompare(a.measured_at));
    }
    return map;
  }, [records, days]);

  const hasData = grid.size > 0;

  function togglePopover(dateStr: string, period: TempPeriod) {
    if (popover?.dateStr === dateStr && popover?.period === period) {
      setPopover(null);
    } else {
      setPopover({ dateStr, period });
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">体温の推移</h3>
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
          <span className="inline-block h-3 w-3 rounded-sm bg-green-200" />
          <span className="text-xs text-muted-foreground">平熱(36.0〜36.9℃)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-yellow-200" />
          <span className="text-xs text-muted-foreground">やや高め(37.0〜37.4℃)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-200" />
          <span className="text-xs text-muted-foreground">発熱(37.5℃〜)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-200" />
          <span className="text-xs text-muted-foreground">低め(〜35.9℃)</span>
        </div>
      </div>

      {!hasData ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          この週の体温記録がありません
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th className="w-[30%] px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                  日付
                </th>
                {PERIODS.map((p) => (
                  <th
                    key={p.value}
                    className="w-[17.5%] px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
                  >
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => {
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
                    {PERIODS.map((p) => {
                      const cellRecords = grid.get(
                        `${day.dateStr}_${p.value}`,
                      );
                      const latest = cellRecords?.[0];
                      const isOpen =
                        popover?.dateStr === day.dateStr &&
                        popover?.period === p.value;

                      return (
                        <td
                          key={p.value}
                          className="relative px-2 py-2 text-center"
                        >
                          {latest ? (
                            <button
                              type="button"
                              onClick={() =>
                                togglePopover(day.dateStr, p.value)
                              }
                              className={cn(
                                "inline-flex cursor-pointer items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold",
                                tempStyle(latest.temperature).bg,
                                tempStyle(latest.temperature).text,
                              )}
                            >
                              {latest.temperature}℃
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">
                              ー
                            </span>
                          )}
                          {/* ポップオーバー（タップで時刻・体温を表示） */}
                          {isOpen && cellRecords && (
                            <div
                              className={cn(
                                "absolute left-1/2 z-10 -translate-x-1/2 rounded-lg border border-border/60 bg-white px-3 py-2 shadow-lg",
                                openUpward ? "bottom-full mb-1" : "top-full mt-1",
                              )}
                            >
                              <div className="space-y-1 text-xs whitespace-nowrap">
                                {cellRecords.map((r) => {
                                  const s = tempStyle(r.temperature);
                                  return (
                                    <div
                                      key={r.id}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="text-muted-foreground">
                                        {formatTime(r.measured_at)}
                                      </span>
                                      <span
                                        className={cn(
                                          "font-bold",
                                          s.text,
                                        )}
                                      >
                                        {r.temperature}℃
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
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
