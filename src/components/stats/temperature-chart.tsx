"use client";

import { useMemo, useState } from "react";
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
import { calcNormalTemperature } from "@/lib/temperature";
import { buildCalendarWeeks, formatMonthLabel } from "@/lib/calendar";
import { TempEditSheet } from "@/components/stats/edit-sheet";
import type { TemperatureRecord, TempPeriod } from "@/types";

const FEVER_LINE = 37.5;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const CAL_WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

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

function tempDotColor(temp: number): string {
  if (temp >= FEVER_LINE) return "bg-red-400";
  if (temp >= 37.0) return "bg-yellow-400";
  if (temp >= 36.0) return "bg-green-400";
  return "bg-blue-400";
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Props = {
  records: TemperatureRecord[];
  onEdit?: (id: string, data: { temperature: number; measured_at: string }) => void;
  onDelete?: (id: string) => void;
};

type ViewMode = "weekly" | "monthly";

export function TemperatureChart({ records, onEdit, onDelete }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [popover, setPopover] = useState<{ dateStr: string; period?: TempPeriod } | null>(null);
  const [editingRecord, setEditingRecord] = useState<TemperatureRecord | null>(null);

  const currentMonday = getMonday(new Date());
  const canGoNextWeek = !isAfter(addWeeks(weekStart, 1), currentMonday);
  const currentMonth = startOfMonth(new Date());
  const canGoNextMonth = !isAfter(addMonths(monthDate, 1), currentMonth);

  // 平熱（全レコード対象）
  const normalTemp = useMemo(() => calcNormalTemperature(records), [records]);

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
    for (const arr of map.values()) {
      arr.sort((a, b) => b.measured_at.localeCompare(a.measured_at));
    }
    return map;
  }, [records, days]);

  // ===== 月別 =====
  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate],
  );

  const monthGrid = useMemo(() => {
    const map = new Map<string, TemperatureRecord[]>();
    for (const r of records) {
      const dateStr = format(new Date(r.measured_at), "yyyy-MM-dd");
      const arr = map.get(dateStr) ?? [];
      arr.push(r);
      map.set(dateStr, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => b.measured_at.localeCompare(a.measured_at));
    }
    return map;
  }, [records]);

  // ===== 共通 =====
  function togglePopover(dateStr: string, period?: TempPeriod) {
    if (popover?.dateStr === dateStr && popover?.period === period) {
      setPopover(null);
    } else {
      setPopover({ dateStr, period });
    }
  }

  function handleDelete(id: string) {
    if (!onDelete) return;
    if (!window.confirm("この体温記録を削除しますか？")) return;
    onDelete(id);
    setPopover(null);
  }

  function handleEditSave(id: string, data: { temperature: number; measured_at: string }) {
    if (!onEdit) return;
    onEdit(id, data);
    setEditingRecord(null);
    setPopover(null);
  }

  function renderPopoverContent(popoverRecords: TemperatureRecord[], openUpward: boolean, align: "left" | "center" | "right" = "center") {
    return (
      <div
        className={cn(
          "absolute z-10 rounded-lg border border-border/60 bg-white px-3 py-2 shadow-lg",
          openUpward ? "bottom-full mb-1" : "top-full mt-1",
          align === "left" && "left-0",
          align === "right" && "right-0",
          align === "center" && "left-1/2 -translate-x-1/2",
        )}
      >
        <div className="space-y-1.5 text-xs whitespace-nowrap">
          {popoverRecords.map((r) => {
            const s = tempStyle(r.temperature);
            return (
              <div key={r.id} className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {formatTime(r.measured_at)}
                </span>
                <span className={cn("font-bold", s.text)}>
                  {r.temperature}℃
                </span>
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
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">体温の推移</h3>

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

      {/* 平熱バッジ */}
      {normalTemp !== null && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            🌡 平熱 {normalTemp}℃
          </span>
        </div>
      )}

      {/* 凡例 */}
      <div className="mx-auto grid w-fit grid-cols-2 gap-x-6 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-green-200" />
          <span className="text-xs text-muted-foreground">平熱</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-yellow-200" />
          <span className="text-xs text-muted-foreground">やや高め</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-200" />
          <span className="text-xs text-muted-foreground">37.5℃〜</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-200" />
          <span className="text-xs text-muted-foreground">〜35.9℃</span>
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
                    {PERIODS.map((p, periodIndex) => {
                      const cellRecords = grid.get(`${day.dateStr}_${p.value}`);
                      const latest = cellRecords?.[0];
                      const isOpen =
                        popover?.dateStr === day.dateStr && popover?.period === p.value;
                      const align = periodIndex === 0 ? "left" as const : periodIndex === PERIODS.length - 1 ? "right" as const : "center" as const;

                      return (
                        <td key={p.value} className="relative px-2 py-2 text-center">
                          {latest ? (
                            <button
                              type="button"
                              onClick={() => togglePopover(day.dateStr, p.value)}
                              className={cn(
                                "inline-flex cursor-pointer items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold",
                                tempStyle(latest.temperature).bg,
                                tempStyle(latest.temperature).text,
                              )}
                            >
                              {latest.temperature}℃
                            </button>
                          ) : (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs text-muted-foreground/40">ー</span>
                          )}
                          {isOpen && cellRecords && renderPopoverContent(cellRecords, openUpward, align)}
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
              <div
                key={wd}
                className="text-center text-[10px] font-medium text-muted-foreground"
              >
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
                    return <div key={di} className="h-10" />;
                  }
                  const dayNum = parseInt(dateStr.slice(8), 10);
                  const dayRecords = monthGrid.get(dateStr);
                  const maxTemp = dayRecords
                    ? Math.max(...dayRecords.map((r) => r.temperature))
                    : null;
                  const isOpen = popover?.dateStr === dateStr && popover?.period === undefined;

                  return (
                    <div key={di} className="relative">
                      <button
                        type="button"
                        onClick={() => dayRecords && togglePopover(dateStr)}
                        className={cn(
                          "flex h-10 w-full flex-col items-center justify-center gap-0.5 rounded-md text-center transition-colors",
                          dayRecords ? "cursor-pointer hover:bg-muted/50" : "cursor-default",
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground">{dayNum}</span>
                        {maxTemp !== null ? (
                          <span
                            className={cn("h-3 w-3 rounded-full", tempDotColor(maxTemp))}
                          />
                        ) : (
                          <span className="flex h-3 items-center text-[10px] leading-none text-muted-foreground/30">ー</span>
                        )}
                      </button>

                      {isOpen && dayRecords && renderPopoverContent(dayRecords, false)}
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
        <TempEditSheet
          record={editingRecord}
          onSave={handleEditSave}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}
