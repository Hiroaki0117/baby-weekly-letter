"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { startOfWeek, addWeeks, addDays, format, isAfter } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { getMyFamilyId } from "@/lib/supabase/family";
import {
  calcWeeklyMoods,
  calcMonthlyMoods,
  calcYearlyMoods,
  calcWeeklyCategoryCounts,
  calcSingleMonthCategoryCounts,
  calcYearlyCategoryCounts,
} from "@/lib/stats";
import type { PeriodType } from "@/lib/stats";
import { fetchGrowthRecords } from "@/lib/growth";
import { fetchTemperatureRecords, updateTemperatureRecord, deleteTemperatureRecord } from "@/lib/temperature";
import { fetchSleepRecords, updateSleepRecord, deleteSleepRecord, calcDurationMinutes, classifySleep } from "@/lib/sleep";
import { fetchMealRecords, updateMealRecord, deleteMealRecord } from "@/lib/meal";
import { PeriodTabs } from "@/components/stats/period-tabs";
import { MoodChart } from "@/components/stats/mood-chart";
import { CategoryPieChart } from "@/components/stats/category-pie-chart";
import { GrowthChart } from "@/components/stats/growth-chart";
import { TemperatureChart } from "@/components/stats/temperature-chart";
import { SleepChart } from "@/components/stats/sleep-chart";
import { MealChart } from "@/components/stats/meal-chart";
import { ChildSelector } from "@/components/child/child-selector";
import { fetchMilestonesByLogIds } from "@/lib/milestones";
import { classifyTempPeriod } from "@/lib/temperature";
import { toast } from "sonner";
import type { Child, DailyLog, GrowthRecord, TemperatureRecord, SleepRecord, MealRecord, Gender, Milestone } from "@/types";

type StatsTab = "logs" | "growth";

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
  const [temperatureRecords, setTemperatureRecords] = useState<Record<string, TemperatureRecord[]>>({});
  const [sleepRecords, setSleepRecords] = useState<Record<string, SleepRecord[]>>({});
  const [mealRecords, setMealRecords] = useState<Record<string, MealRecord[]>>({});
  const [milestoneMap, setMilestoneMap] = useState<Record<string, Milestone>>({});
  const [statsTab, setStatsTab] = useState<StatsTab>("logs");
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
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

      // マイルストーン取得
      if (logs.length > 0) {
        const logIds = logs.map((l) => l.id);
        const msMap = await fetchMilestonesByLogIds(client, logIds);
        setMilestoneMap(msMap);
      }

      // 成長記録・体温記録・睡眠記録・食事記録を並行取得
      const growthMap: Record<string, GrowthRecord[]> = {};
      const tempMap: Record<string, TemperatureRecord[]> = {};
      const sleepMap: Record<string, SleepRecord[]> = {};
      const mealMap: Record<string, MealRecord[]> = {};
      await Promise.all(
        children.map(async (child) => {
          try {
            growthMap[child.id] = await fetchGrowthRecords(client, child.id);
          } catch {
            growthMap[child.id] = [];
          }
          try {
            tempMap[child.id] = await fetchTemperatureRecords(client, child.id);
          } catch {
            tempMap[child.id] = [];
          }
          try {
            sleepMap[child.id] = await fetchSleepRecords(client, child.id);
          } catch {
            sleepMap[child.id] = [];
          }
          try {
            mealMap[child.id] = await fetchMealRecords(client, child.id);
          } catch {
            mealMap[child.id] = [];
          }
        })
      );
      setGrowthRecords(growthMap);
      setTemperatureRecords(tempMap);
      setSleepRecords(sleepMap);
      setMealRecords(mealMap);

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

  const milestoneLogIds = useMemo(
    () => new Set(filtered.filter((log) => milestoneMap[log.id]).map((log) => log.id)),
    [filtered, milestoneMap]
  );

  const categoryCounts = useMemo(() => {
    switch (period) {
      case "weekly":
        return calcWeeklyCategoryCounts(filtered, weekStart, milestoneLogIds);
      case "monthly":
        return calcSingleMonthCategoryCounts(filtered, selectedYear, selectedMonth, milestoneLogIds);
      case "yearly":
        return calcYearlyCategoryCounts(filtered, milestoneLogIds);
    }
  }, [filtered, period, weekStart, selectedYear, selectedMonth, milestoneLogIds]);

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

  // 成長タブ用
  const selectedChild = childrenList.find((c) => c.id === selectedChildId);
  const selectedGrowthRecords = growthRecords[selectedChildId] ?? [];
  const selectedTempRecords = temperatureRecords[selectedChildId] ?? [];
  const selectedSleepRecords = sleepRecords[selectedChildId] ?? [];
  const selectedMealRecords = mealRecords[selectedChildId] ?? [];
  const hasGrowthData = selectedChild?.birth_date && selectedGrowthRecords.length > 0;

  // ===== 体温 編集・削除 =====
  const handleTempEdit = useCallback(
    async (id: string, data: { temperature: number; measured_at: string }) => {
      if (!selectedChildId) return;
      try {
        await updateTemperatureRecord(supabaseRef.current, id, {
          temperature: data.temperature,
          measured_at: data.measured_at,
          temp_period: classifyTempPeriod(data.measured_at),
        });
        const updated = await fetchTemperatureRecords(supabaseRef.current, selectedChildId);
        setTemperatureRecords((prev) => ({ ...prev, [selectedChildId]: updated }));
        toast.success("体温記録を更新しました");
      } catch {
        toast.error("更新に失敗しました");
      }
    },
    [selectedChildId],
  );

  const handleTempDelete = useCallback(
    async (id: string) => {
      if (!selectedChildId) return;
      try {
        await deleteTemperatureRecord(supabaseRef.current, id);
        const updated = await fetchTemperatureRecords(supabaseRef.current, selectedChildId);
        setTemperatureRecords((prev) => ({ ...prev, [selectedChildId]: updated }));
        toast.success("体温記録を削除しました");
      } catch {
        toast.error("削除に失敗しました");
      }
    },
    [selectedChildId],
  );

  // ===== 睡眠 編集・削除 =====
  const handleSleepEdit = useCallback(
    async (id: string, data: { started_at: string; ended_at: string }) => {
      if (!selectedChildId) return;
      try {
        const durationMinutes = calcDurationMinutes(data.started_at, data.ended_at);
        const sleepCategory = classifySleep(data.started_at);
        const sleepDate = format(new Date(data.started_at), "yyyy-MM-dd");
        await updateSleepRecord(supabaseRef.current, id, {
          started_at: data.started_at,
          ended_at: data.ended_at,
          duration_minutes: durationMinutes,
          sleep_category: sleepCategory,
          sleep_date: sleepDate,
        });
        const updated = await fetchSleepRecords(supabaseRef.current, selectedChildId);
        setSleepRecords((prev) => ({ ...prev, [selectedChildId]: updated }));
        toast.success("睡眠記録を更新しました");
      } catch {
        toast.error("更新に失敗しました");
      }
    },
    [selectedChildId],
  );

  const handleSleepDelete = useCallback(
    async (id: string) => {
      if (!selectedChildId) return;
      try {
        await deleteSleepRecord(supabaseRef.current, id);
        const updated = await fetchSleepRecords(supabaseRef.current, selectedChildId);
        setSleepRecords((prev) => ({ ...prev, [selectedChildId]: updated }));
        toast.success("睡眠記録を削除しました");
      } catch {
        toast.error("削除に失敗しました");
      }
    },
    [selectedChildId],
  );

  // ===== 食事 編集・削除 =====
  const handleMealEdit = useCallback(
    async (id: string, data: { amount: string }) => {
      if (!selectedChildId) return;
      try {
        await updateMealRecord(supabaseRef.current, id, {
          amount: data.amount,
        });
        const updated = await fetchMealRecords(supabaseRef.current, selectedChildId);
        setMealRecords((prev) => ({ ...prev, [selectedChildId]: updated }));
        toast.success("食事記録を更新しました");
      } catch {
        toast.error("更新に失敗しました");
      }
    },
    [selectedChildId],
  );

  const handleMealDelete = useCallback(
    async (id: string) => {
      if (!selectedChildId) return;
      try {
        await deleteMealRecord(supabaseRef.current, id);
        const updated = await fetchMealRecords(supabaseRef.current, selectedChildId);
        setMealRecords((prev) => ({ ...prev, [selectedChildId]: updated }));
        toast.success("食事記録を削除しました");
      } catch {
        toast.error("削除に失敗しました");
      }
    },
    [selectedChildId],
  );

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

  return (
    <div className="space-y-5">
      {/* ページヘッダー */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Stats
        </p>
        <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
          統計
        </h1>
      </div>

      {/* 子供セレクター */}
      {childrenList.length >= 2 && (
        <ChildSelector
          childrenList={childrenList}
          selectedId={selectedChildId}
          onChange={setSelectedChildId}
        />
      )}

      {/* 大元タブ: 記録 / 成長 */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
        {(
          [
            { key: "logs", label: "記録" },
            { key: "growth", label: "からだの記録" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setStatsTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              statsTab === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 記録タブ */}
      {statsTab === "logs" && (
        <>
          {allLogs.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                まだ記録がありません。記録を追加すると統計が表示されます。
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <PeriodTabs
                period={period}
                onChangePeriod={setPeriod}
                label={periodLabel}
                onPrev={period !== "yearly" ? handlePrev : undefined}
                onNext={period !== "yearly" ? handleNext : undefined}
                canGoNext={canGoNext}
              />

              <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-foreground">記録の様子</h3>
                <MoodChart data={moodData} scrollable={scrollable} />
              </div>

              {filtered.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                  <CategoryPieChart
                    data={categoryCounts}
                    period={period}
                    selectedMonth={selectedMonth}
                    onChangeMonth={setSelectedMonth}
                  />
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* からだの記録タブ */}
      {statsTab === "growth" && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            {hasGrowthData ? (
              <GrowthChart
                records={selectedGrowthRecords}
                birthDate={selectedChild!.birth_date!}
                gender={(selectedChild!.gender as Gender) ?? null}
              />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                家族画面からお子さまの成長記録を追加すると、成長曲線が表示されます。
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <TemperatureChart records={selectedTempRecords} onEdit={handleTempEdit} onDelete={handleTempDelete} />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <SleepChart records={selectedSleepRecords} onEdit={handleSleepEdit} onDelete={handleSleepDelete} />
          </div>

          <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <MealChart records={selectedMealRecords} onEdit={handleMealEdit} onDelete={handleMealDelete} />
          </div>
        </div>
      )}
    </div>
  );
}
