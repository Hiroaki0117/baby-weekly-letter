"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { startOfWeek, addWeeks, addDays, format, isAfter } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { getMyFamilyId } from "@/lib/supabase/family";
import {
  calcWeeklyMoods,
  calcMonthlyMoods,
  calcYearlyMoods,
  calcCategoryCounts,
} from "@/lib/stats";
import type { PeriodType } from "@/lib/stats";
import { fetchGrowthRecords } from "@/lib/growth";
import { PeriodTabs } from "@/components/stats/period-tabs";
import { MoodChart } from "@/components/stats/mood-chart";
import { CategoryPieChart } from "@/components/stats/category-pie-chart";
import { GrowthChart } from "@/components/stats/growth-chart";
import { ChildSelector } from "@/components/child/child-selector";
import type { Child, DailyLog, GrowthRecord, Gender } from "@/types";

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  return `${format(weekStart, "yyyy年M月d日")}〜${format(weekEnd, "M月d日")}`;
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [growthRecords, setGrowthRecords] = useState<Record<string, GrowthRecord[]>>({});
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const client = supabaseRef.current;

    async function load() {
      const familyId = await getMyFamilyId(client);
      if (!familyId) {
        setLoading(false);
        return;
      }

      const [logsRes, childrenRes] = await Promise.all([
        client
          .from("daily_logs")
          .select("*")
          .eq("family_id", familyId)
          .order("log_date", { ascending: true }),
        client
          .from("children")
          .select("*")
          .eq("family_id", familyId)
          .order("created_at", { ascending: true }),
      ]);

      const logs = (logsRes.data as DailyLog[]) ?? [];
      const children = (childrenRes.data as Child[]) ?? [];

      setAllLogs(logs);
      setChildrenList(children);

      if (children.length > 0) {
        setSelectedChildId(children[0].id);
      }

      // 成長記録を並行取得
      const growthMap: Record<string, GrowthRecord[]> = {};
      await Promise.all(
        children.map(async (child) => {
          try {
            growthMap[child.id] = await fetchGrowthRecords(client, child.id);
          } catch {
            growthMap[child.id] = [];
          }
        })
      );
      setGrowthRecords(growthMap);

      setLoading(false);
    }

    load();
  }, []);

  // 子どもでフィルタ
  const filtered = useMemo(
    () => (selectedChildId ? allLogs.filter((l) => l.child_id === selectedChildId) : []),
    [selectedChildId, allLogs]
  );

  // 期間に応じた集計
  const moodData = useMemo(() => {
    switch (period) {
      case "weekly":
        return calcWeeklyMoods(filtered, weekStart);
      case "monthly":
        return calcMonthlyMoods(filtered, selectedYear);
      case "yearly":
        return calcYearlyMoods(filtered);
    }
  }, [filtered, period, weekStart, selectedYear]);

  const categoryCounts = useMemo(() => calcCategoryCounts(filtered), [filtered]);

  // ナビゲーション
  const currentMonday = getMonday(new Date());
  const currentYear = new Date().getFullYear();

  const handlePrev = useCallback(() => {
    if (period === "weekly") setWeekStart((prev) => addWeeks(prev, -1));
    if (period === "monthly") setSelectedYear((prev) => prev - 1);
  }, [period]);

  const handleNext = useCallback(() => {
    if (period === "weekly") setWeekStart((prev) => addWeeks(prev, 1));
    if (period === "monthly") setSelectedYear((prev) => prev + 1);
  }, [period]);

  const canGoNext = useMemo(() => {
    if (period === "weekly") return !isAfter(addWeeks(weekStart, 1), currentMonday);
    if (period === "monthly") return selectedYear < currentYear;
    return false;
  }, [period, weekStart, currentMonday, selectedYear, currentYear]);

  const periodLabel = useMemo(() => {
    switch (period) {
      case "weekly":
        return formatWeekLabel(weekStart);
      case "monthly":
        return `${selectedYear}年`;
      case "yearly":
        return `${currentYear - 4}年〜${currentYear}年`;
    }
  }, [period, weekStart, selectedYear, currentYear]);

  const scrollable = period === "monthly";

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold text-foreground">統計</h1>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const hasLogs = allLogs.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">統計</h1>

      {childrenList.length >= 2 && (
        <ChildSelector
          childrenList={childrenList}
          selectedId={selectedChildId}
          onChange={setSelectedChildId}
        />
      )}

      {!hasLogs ? (
        <div className="rounded-xl border border-border/50 bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            まだ記録がありません。記録を追加すると統計が表示されます。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 期間タブ */}
          <PeriodTabs
            period={period}
            onChangePeriod={setPeriod}
            label={periodLabel}
            onPrev={period !== "yearly" ? handlePrev : undefined}
            onNext={period !== "yearly" ? handleNext : undefined}
            canGoNext={canGoNext}
          />

          {/* 記録の様子 */}
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">記録の様子</h3>
            <MoodChart data={moodData} scrollable={scrollable} />
          </div>

          {/* カテゴリ別（全期間） */}
          {categoryCounts.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
              <CategoryPieChart data={categoryCounts} />
            </div>
          )}

          {/* 成長曲線 */}
          {(() => {
            const selectedChild = childrenList.find((c) => c.id === selectedChildId);
            const records = growthRecords[selectedChildId] ?? [];
            if (!selectedChild?.birth_date || records.length === 0) return null;
            return (
              <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground">成長曲線</h3>
                <GrowthChart
                  records={records}
                  birthDate={selectedChild.birth_date}
                  gender={(selectedChild.gender as Gender) ?? null}
                />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
