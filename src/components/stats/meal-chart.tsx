"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  startOfWeek,
  addWeeks,
  addDays,
  addMonths,
  isAfter,
  format,
  startOfMonth,
} from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildCalendarWeeks, formatMonthLabel } from "@/lib/calendar";
import { MealEditSheet } from "@/components/stats/edit-sheet";
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
  none: { bg: "bg-red-100", text: "text-red-700", label: "×" },
};

const MINI_AMOUNT_COLORS: Record<string, string> = {
  plenty: "text-green-600",
  normal: "text-blue-600",
  little: "text-yellow-600",
  none: "text-red-500",
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const CAL_WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "yyyy年M月d日")}〜${format(weekEnd, "M月d日")}`;
}

type Props = {
  records: MealRecord[];
  onEdit?: (id: string, data: { amount: string }) => void;
  onDelete?: (id: string) => void;
};

type ViewMode = "weekly" | "monthly";

export function MealChart({ records, onEdit, onDelete }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [popover, setPopover] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<MealRecord | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const closePopover = useCallback(() => setPopover(null), []);

  useEffect(() => {
    if (!popover) return;
    function handleMouseDown(e: MouseEvent) {
      if (chartRef.current && !chartRef.current.contains(e.target as Node)) {
        closePopover();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [popover, closePopover]);

  const currentMonday = getMonday(new Date());
  const canGoNextWeek = !isAfter(addWeeks(weekStart, 1), currentMonday);
  const currentMonth = startOfMonth(new Date());
  const canGoNextMonth = !isAfter(addMonths(monthDate, 1), currentMonth);

  // ===== 週別 =====
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

  const weekGrid = useMemo(() => {
    const map = new Map<string, MealRecord>();
    for (const r of records) {
      const key = `${r.meal_date}_${r.meal_type}`;
      const existing = map.get(key);
      if (!existing || r.created_at > existing.created_at) {
        map.set(key, r);
      }
    }
    return map;
  }, [records]);

  // ===== 月別 =====
  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate],
  );

  // 日付 → MealType → MealRecord
  const monthGrid = useMemo(() => {
    const map = new Map<string, Map<MealType, MealRecord>>();
    for (const r of records) {
      let dayMap = map.get(r.meal_date);
      if (!dayMap) {
        dayMap = new Map();
        map.set(r.meal_date, dayMap);
      }
      const existing = dayMap.get(r.meal_type as MealType);
      if (!existing || r.created_at > existing.created_at) {
        dayMap.set(r.meal_type as MealType, r);
      }
    }
    return map;
  }, [records]);

  function togglePopover(dateStr: string) {
    setPopover(popover === dateStr ? null : dateStr);
  }

  function handleDelete(id: string) {
    if (!onDelete) return;
    if (!window.confirm("この食事記録を削除しますか？")) return;
    onDelete(id);
    setPopover(null);
  }

  function handleEditSave(id: string, data: { amount: string }) {
    if (!onEdit) return;
    onEdit(id, data);
    setEditingRecord(null);
    setPopover(null);
  }

  return (
    <div ref={chartRef} className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">食事量の推移</h3>

        {/* 週別/月別タブ */}
        <div className="flex justify-center">
          <div className="flex rounded-lg border border-border/60 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("weekly")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === "weekly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              週別
            </button>
            <button
              type="button"
              onClick={() => setViewMode("monthly")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                viewMode === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              月別
            </button>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() =>
                viewMode === "weekly"
                  ? setWeekStart((prev) => addWeeks(prev, -1))
                  : setMonthDate((prev) => addMonths(prev, -1))
              }
              className="flex h-7 w-7 items-center justify-center rounded-md text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              ‹
            </button>
            <span className="text-xs font-semibold text-foreground">
              {viewMode === "weekly"
                ? formatWeekLabel(weekStart)
                : formatMonthLabel(monthDate.getFullYear(), monthDate.getMonth())}
            </span>
            <button
              type="button"
              onClick={() =>
                viewMode === "weekly"
                  ? setWeekStart((prev) => addWeeks(prev, 1))
                  : setMonthDate((prev) => addMonths(prev, 1))
              }
              disabled={viewMode === "weekly" ? !canGoNextWeek : !canGoNextMonth}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md text-base transition-colors",
                (viewMode === "weekly" ? canGoNextWeek : canGoNextMonth)
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

      {/* ===== 週別テーブル ===== */}
      {viewMode === "weekly" && (
        <div>
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
                    {MEAL_TYPES.map((mt, mtIndex) => {
                      const record = weekGrid.get(`${day.dateStr}_${mt.value}`);
                      const style = record ? AMOUNT_STYLES[record.amount] : null;
                      const isOpen = popover === `${day.dateStr}_${mt.value}`;
                      return (
                        <td key={mt.value} className="relative px-2 py-2 text-center">
                          {style && record ? (
                            <button
                              type="button"
                              onClick={() => togglePopover(`${day.dateStr}_${mt.value}`)}
                              className={cn(
                                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-sm font-bold",
                                style.bg,
                                style.text,
                              )}
                            >
                              {style.label}
                            </button>
                          ) : (
                            <span className="inline-flex h-7 w-7 items-center justify-center text-xs text-muted-foreground/40">ー</span>
                          )}
                          {isOpen && record && (
                            <div className={cn(
                              "absolute top-full z-10 mt-1 rounded-lg border border-border/60 bg-white px-3 py-2 shadow-lg",
                              mtIndex === 0 && "left-0",
                              mtIndex === MEAL_TYPES.length - 1 && "right-0",
                              mtIndex > 0 && mtIndex < MEAL_TYPES.length - 1 && "left-1/2 -translate-x-1/2",
                            )}>
                              <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                                <span className="text-muted-foreground">{mt.label}</span>
                                <span className={cn("font-bold", style?.text)}>
                                  {style?.label}
                                </span>
                                {onEdit && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setEditingRecord(record); }}
                                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                                    aria-label="編集"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-red-50 hover:text-red-500"
                                    aria-label="削除"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
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

      {/* ===== 月別カレンダー ===== */}
      {viewMode === "monthly" && (
        <div>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {CAL_WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-[10px] font-medium text-muted-foreground">
                {wd}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="space-y-1">
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((dateStr, di) => {
                  if (!dateStr) {
                    return <div key={di} className="h-12" />;
                  }
                  const dayNum = parseInt(dateStr.slice(8), 10);
                  const dayMap = monthGrid.get(dateStr);
                  const hasMeals = dayMap && dayMap.size > 0;
                  const isOpen = popover === dateStr;

                  return (
                    <div key={di} className="relative">
                      <button
                        type="button"
                        onClick={() => hasMeals && togglePopover(dateStr)}
                        className={cn(
                          "flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-md transition-colors",
                          hasMeals ? "cursor-pointer hover:bg-muted/50" : "cursor-default",
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground">{dayNum}</span>
                        {hasMeals ? (
                          <div className="flex items-center gap-px">
                            {MEAL_TYPES.map((mt) => {
                              const rec = dayMap.get(mt.value);
                              if (!rec) return null;
                              const color = MINI_AMOUNT_COLORS[rec.amount] ?? "text-muted-foreground";
                              const label = AMOUNT_STYLES[rec.amount]?.label ?? "?";
                              return (
                                <span
                                  key={mt.value}
                                  className={cn("text-[10px] font-bold leading-none", color)}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="flex items-center text-[10px] leading-none text-muted-foreground/30">ー</span>
                        )}
                      </button>

                      {isOpen && dayMap && (
                        <div className={cn(
                          "absolute top-full z-10 mt-1 rounded-lg border border-border/60 bg-white px-3 py-2 shadow-lg",
                          di === 0 && "left-0",
                          di === 6 && "right-0",
                          di > 0 && di < 6 && "left-1/2 -translate-x-1/2",
                        )}>
                          <div className="space-y-1.5 text-xs whitespace-nowrap">
                            {MEAL_TYPES.map((mt) => {
                              const rec = dayMap.get(mt.value);
                              if (!rec) return null;
                              const style = AMOUNT_STYLES[rec.amount];
                              return (
                                <div key={mt.value} className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{mt.label}</span>
                                  <span className={cn("font-bold", style?.text)}>
                                    {style?.label}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {rec.amount === "plenty"
                                      ? "よく食べた"
                                      : rec.amount === "normal"
                                        ? "ふつう"
                                        : rec.amount === "little"
                                          ? "少なめ"
                                          : "食べなかった"}
                                  </span>
                                  {onEdit && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setEditingRecord(rec); }}
                                      className="ml-auto flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                                      aria-label="編集"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  )}
                                  {onDelete && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleDelete(rec.id); }}
                                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-red-50 hover:text-red-500"
                                      aria-label="削除"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 編集シート */}
      {editingRecord && (
        <MealEditSheet
          record={editingRecord}
          onSave={handleEditSave}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}
