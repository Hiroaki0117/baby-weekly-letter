"use client";

import { useMemo, useState } from "react";
import { startOfWeek, addWeeks, addDays, isAfter, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { MealRecord, MealType } from "@/types";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "朝食" },
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
  { value: "snack", label: "おやつ" },
];

const AMOUNT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  plenty: { bg: "bg-green-100", text: "text-green-700", label: "◎" },
  normal: { bg: "bg-blue-100", text: "text-blue-700", label: "○" },
  little: { bg: "bg-yellow-100", text: "text-yellow-700", label: "△" },
  none:   { bg: "bg-red-100", text: "text-red-700", label: "×" },
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "yyyy年M月d日")}〜${format(weekEnd, "M月d日")}`;
}

type Props = {
  records: MealRecord[];
};

export function MealChart({ records }: Props) {
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

  // 日付×食事種別 → MealRecord のマップ
  const grid = useMemo(() => {
    const map = new Map<string, MealRecord>();
    for (const r of records) {
      const key = `${r.meal_date}_${r.meal_type}`;
      // 同じ日・同じ種別に複数ある場合は最新を使用
      const existing = map.get(key);
      if (!existing || r.created_at > existing.created_at) {
        map.set(key, r);
      }
    }
    return map;
  }, [records]);

  const hasData = records.some((r) =>
    days.some((d) => r.meal_date === d.dateStr),
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">食事量の推移</h3>
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

      {/* 凡例 2×2 グリッド */}
      <div className="mx-auto grid w-fit grid-cols-2 gap-x-6 gap-y-1">
        {Object.entries(AMOUNT_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold",
                style.bg,
                style.text,
              )}
            >
              {style.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {key === "plenty"
                ? "よく食べた"
                : key === "normal"
                  ? "ふつう"
                  : key === "little"
                    ? "少なめ"
                    : "食べなかった"}
            </span>
          </div>
        ))}
      </div>

      {!hasData ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          この週の食事記録がありません
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr>
                <th className="w-[30%] px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">
                  日付
                </th>
                {MEAL_TYPES.map((mt) => (
                  <th
                    key={mt.value}
                    className="w-[17.5%] px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
                  >
                    {mt.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
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
                    {MEAL_TYPES.map((mt) => {
                      const record = grid.get(`${day.dateStr}_${mt.value}`);
                      const style = record
                        ? AMOUNT_STYLES[record.amount]
                        : null;
                      return (
                        <td key={mt.value} className="px-2 py-2 text-center">
                          {style ? (
                            <span
                              className={cn(
                                "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold",
                                style.bg,
                                style.text,
                              )}
                            >
                              {style.label}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">
                              ー
                            </span>
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
