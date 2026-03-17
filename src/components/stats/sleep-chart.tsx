"use client";

import { useMemo, useRef, useState, useEffect } from "react";
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
import { SleepEditSheet } from "@/components/stats/edit-sheet";
import type { SleepRecord, SleepCategory } from "@/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const CAL_WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

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
  onEdit?: (id: string, data: { started_at: string; ended_at: string }) => void;
  onDelete?: (id: string) => void;
};

type ViewMode = "weekly" | "monthly";

export function SleepChart({ records, onEdit, onDelete }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [popover, setPopover] = useState<{ dateStr: string; category?: SleepCategory } | null>(null);
  const [editingRecord, setEditingRecord] = useState<SleepRecord | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popover) return;
    function handleMouseDown(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [popover]);

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

  // ===== 月別 =====
  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate],
  );

  const monthGrid = useMemo(() => {
    const map = new Map<string, { night: number; daytime: number }>();
    for (const r of records) {
      const entry = map.get(r.sleep_date) ?? { night: 0, daytime: 0 };
      if (r.sleep_category === "night") {
        entry.night += r.duration_minutes;
      } else {
        entry.daytime += r.duration_minutes;
      }
      map.set(r.sleep_date, entry);
    }
    return map;
  }, [records]);

  const monthDetailMap = useMemo(() => {
    const map = new Map<string, SleepRecord[]>();
    for (const r of records) {
      const arr = map.get(r.sleep_date) ?? [];
      arr.push(r);
      map.set(r.sleep_date, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.started_at.localeCompare(b.started_at));
    }
    return map;
  }, [records]);

  // 月別で当月に該当する日の合計分数から最大値を取得（バー正規化用）
  const monthMaxMinutes = useMemo(() => {
    let max = 0;
    for (const week of calendarWeeks) {
      for (const d of week) {
        if (!d) continue;
        const entry = monthGrid.get(d);
        if (entry) {
          max = Math.max(max, entry.night + entry.daytime);
        }
      }
    }
    return max || 1;
  }, [calendarWeeks, monthGrid]);

  // 月別サマリー
  const monthSummary = useMemo(() => {
    let totalMinutes = 0;
    let dayCount = 0;
    let maxMinutes = 0;
    for (const week of calendarWeeks) {
      for (const d of week) {
        if (!d) continue;
        const entry = monthGrid.get(d);
        if (entry) {
          const total = entry.night + entry.daytime;
          if (total > 0) {
            totalMinutes += total;
            dayCount++;
            maxMinutes = Math.max(maxMinutes, total);
          }
        }
      }
    }
    if (dayCount === 0) return null;
    return {
      avg: formatHourMin(Math.round(totalMinutes / dayCount)),
      max: formatHourMin(maxMinutes),
    };
  }, [calendarWeeks, monthGrid]);

  function togglePopover(dateStr: string, category?: SleepCategory) {
    if (popover?.dateStr === dateStr && popover?.category === category) {
      setPopover(null);
    } else {
      setPopover({ dateStr, category });
    }
  }

  function handleDelete(id: string) {
    if (!onDelete) return;
    if (!window.confirm("この睡眠記録を削除しますか？")) return;
    onDelete(id);
    setPopover(null);
  }

  function handleEditSave(id: string, data: { started_at: string; ended_at: string }) {
    if (!onEdit) return;
    onEdit(id, data);
    setEditingRecord(null);
    setPopover(null);
  }

  function renderSleepPopover(popoverRecords: SleepRecord[], openUpward: boolean, align: "left" | "center" | "right" = "center") {
    if (popoverRecords.length === 0) return null;
    return (
      <div
        ref={popoverRef}
        className={cn(
          "absolute z-10 rounded-lg border border-border/60 bg-white px-3 py-2 shadow-lg",
          openUpward ? "bottom-full mb-1" : "top-full mt-1",
          align === "left" && "left-0",
          align === "right" && "right-0",
          align === "center" && "left-1/2 -translate-x-1/2",
        )}
      >
        <div className="space-y-1.5 text-xs whitespace-nowrap">
          {popoverRecords.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <span className="text-muted-foreground">{formatTimeFromISO(r.started_at)}</span>
              <span className="text-muted-foreground">〜</span>
              <span className="text-muted-foreground">{formatTimeFromISO(r.ended_at)}</span>
              <span className="font-medium text-foreground">{formatHourMin(r.duration_minutes)}</span>
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingRecord(r); }}
                  className="ml-auto flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="編集"
                >
                  <Pencil size={12} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label="削除"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const BAR_MAX_H = 32;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">睡眠時間の推移</h3>

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
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-amber-400" />
          <span className="text-xs text-muted-foreground">日中睡眠</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-indigo-400" />
          <span className="text-xs text-muted-foreground">夜間睡眠</span>
        </div>
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
                const entry = weekGrid.get(day.dateStr) ?? { night: 0, daytime: 0 };
                const total = entry.night + entry.daytime;
                const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
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
                        <span className="inline-flex items-center text-xs text-muted-foreground/40">ー</span>
                      )}
                      {popover?.dateStr === day.dateStr && popover?.category === "daytime" &&
                        renderSleepPopover(detailMap.get(`${day.dateStr}_daytime`) ?? [], openUpward, "left")}
                    </td>
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
                        <span className="inline-flex items-center text-xs text-muted-foreground/40">ー</span>
                      )}
                      {popover?.dateStr === day.dateStr && popover?.category === "night" &&
                        renderSleepPopover(detailMap.get(`${day.dateStr}_night`) ?? [], openUpward)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {total > 0 ? (
                        <span className="text-xs font-bold text-foreground">
                          {formatHourMin(total)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-muted-foreground/40">ー</span>
                      )}
                    </td>
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
                  const entry = monthGrid.get(dateStr);
                  const total = entry ? entry.night + entry.daytime : 0;
                  const nightH = entry ? (entry.night / monthMaxMinutes) * BAR_MAX_H : 0;
                  const dayH = entry ? (entry.daytime / monthMaxMinutes) * BAR_MAX_H : 0;
                  const isOpen = popover?.dateStr === dateStr && popover?.category === undefined;

                  return (
                    <div key={di} className="relative">
                      <button
                        type="button"
                        onClick={() => total > 0 && togglePopover(dateStr)}
                        className={cn(
                          "flex h-12 w-full flex-col items-center justify-end gap-0 rounded-md pb-0.5 transition-colors",
                          total > 0 ? "cursor-pointer hover:bg-muted/50" : "cursor-default",
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground mb-auto pt-0.5">
                          {dayNum}
                        </span>
                        {total > 0 ? (
                          <div className="flex flex-col items-center justify-end w-3">
                            <div
                              className="w-full rounded-t-sm bg-indigo-400"
                              style={{ height: `${Math.max(nightH, 1)}px` }}
                            />
                            {dayH > 0 && (
                              <div
                                className="w-full bg-amber-400"
                                style={{ height: `${dayH}px` }}
                              />
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-[10px] leading-none text-muted-foreground/30">ー</span>
                        )}
                      </button>

                      {isOpen && entry &&
                        renderSleepPopover(monthDetailMap.get(dateStr) ?? [], false, di === 0 ? "left" : di === 6 ? "right" : "center")}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* サマリー */}
          <div className="mt-3 flex justify-center gap-6 text-xs text-muted-foreground">
            {monthSummary ? (
              <>
                <span>
                  平均 <span className="font-semibold text-foreground">{monthSummary.avg}</span>
                </span>
                <span>
                  最長 <span className="font-semibold text-foreground">{monthSummary.max}</span>
                </span>
              </>
            ) : (
              <span className="text-muted-foreground/40">記録なし</span>
            )}
          </div>
        </div>
      )}

      {/* 編集シート */}
      {editingRecord && (
        <SleepEditSheet
          record={editingRecord}
          onSave={handleEditSave}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}
