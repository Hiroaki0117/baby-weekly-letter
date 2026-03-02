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
import { MilestoneTimeline } from "@/components/stats/milestone-timeline";
import { ChildSelector } from "@/components/child/child-selector";
import type { Child, DailyLog, GrowthRecord, Gender } from "@/types";

type StatsTab = "logs" | "growth";
type GrowthSubTab = "physical" | "milestones";

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
  const [statsTab, setStatsTab] = useState<StatsTab>("logs");
  const [growthSubTab, setGrowthSubTab] = useState<GrowthSubTab>("physical");
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

  // 成長タブ用
  const selectedChild = childrenList.find((c) => c.id === selectedChildId);
  const selectedGrowthRecords = growthRecords[selectedChildId] ?? [];
  const hasGrowthData = selectedChild?.birth_date && selectedGrowthRecords.length > 0;

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
            { key: "growth", label: "成長" },
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

              {categoryCounts.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                  <CategoryPieChart data={categoryCounts} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 成長タブ */}
      {statsTab === "growth" && (
        <div className="space-y-4">
          {/* 小項目タブ */}
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {(
              [
                { key: "physical", label: "身長・体重" },
                { key: "milestones", label: "初めての出来事" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setGrowthSubTab(t.key)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  growthSubTab === t.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 身長・体重 */}
          {growthSubTab === "physical" && (
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
          )}

          {/* 初めての出来事 */}
          {growthSubTab === "milestones" && selectedChildId && (
            <MilestoneTimeline childId={selectedChildId} />
          )}
        </div>
      )}
    </div>
  );
}
