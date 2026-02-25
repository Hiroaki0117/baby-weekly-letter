"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toDateString, getCalendarRange, formatDateJa } from "@/lib/date";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { LogCard } from "@/components/log/log-card";
import { toast } from "sonner";
import type { DailyLog } from "@/types";

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [logsByDate, setLogsByDate] = useState<Record<string, DailyLog[]>>({});
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const membersFetchedRef = useRef(false);

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const { start, end } = getCalendarRange(year, month);
      const startStr = toDateString(start);
      const endStr = toDateString(end);

      const { data, error } = await client
        .from("daily_logs")
        .select("*")
        .gte("log_date", startStr)
        .lte("log_date", endStr)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("ログの取得に失敗しました");
        return;
      }

      const logs = (data as DailyLog[]) ?? [];
      const grouped: Record<string, DailyLog[]> = {};
      for (const log of logs) {
        if (!grouped[log.log_date]) {
          grouped[log.log_date] = [];
        }
        grouped[log.log_date].push(log);
      }
      setLogsByDate(grouped);

      if (!membersFetchedRef.current) {
        membersFetchedRef.current = true;
        const { data: members } = await client
          .from("family_members")
          .select("user_id, display_name");
        if (members) {
          const names: Record<string, string> = {};
          for (const m of members as { user_id: string; display_name: string | null }[]) {
            if (m.display_name) names[m.user_id] = m.display_name;
          }
          setAuthorNames(names);
        }
      }

      setLoading(false);
    }
    load();
  }, [year, month]);

  function handlePrevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  }

  function handleNextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function handleGoToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(null);
  }

  function handleSelectMonth(y: number, m: number) {
    setYear(y);
    setMonth(m);
    setSelectedDate(null);
  }

  function handleSelectDate(dateStr: string) {
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  }

  // 選択日のログを編集不可で表示（閲覧のみ）
  const selectedLogs = selectedDate ? (logsByDate[selectedDate] ?? []) : [];

  // 編集・削除はログ一覧ページで行う想定。カレンダーでは閲覧のみ。
  function handleEditNoop() {
    toast.info("ログの編集は「記録」ページで行えます");
  }

  function handleDeleteNoop() {
    toast.info("ログの削除は「記録」ページで行えます");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ページヘッダー */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Calendar
        </p>
        <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
          カレンダー
        </h1>
      </div>

      <div className="h-px bg-border/60" />

      {/* カレンダーグリッド */}
      <CalendarGrid
        year={year}
        month={month}
        logsByDate={logsByDate}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isCurrentMonth={isCurrentMonth}
        onGoToToday={handleGoToToday}
        onSelectMonth={handleSelectMonth}
      />

      {/* 選択日のログ一覧 */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              {formatDateJa(selectedDate)}
              {selectedLogs.length > 0
                ? ` ・ ${selectedLogs.length}件`
                : ""}
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {selectedLogs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                この日のログはありません
              </p>
            </div>
          ) : (
            selectedLogs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                authorDisplayName={authorNames[log.author_id]}
                onEdit={handleEditNoop}
                onDelete={handleDeleteNoop}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
