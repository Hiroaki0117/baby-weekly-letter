"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMyFamilyId } from "@/lib/supabase/family";
import {
  calcMonthlyCounts,
  calcMonthlyMoods,
  calcCategoryCounts,
} from "@/lib/stats";
import { MonthlyCountChart } from "@/components/stats/monthly-count-chart";
import { MoodTrendChart } from "@/components/stats/mood-trend-chart";
import { CategoryPieChart } from "@/components/stats/category-pie-chart";
import { ChildSelector } from "@/components/child/child-selector";
import type { Child, DailyLog } from "@/types";

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const supabaseRef = useRef(createClient());

  // 初回: 家族のログと子ども一覧を取得
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

      setLoading(false);
    }

    load();
  }, []);

  // 子ども切替時: フィルタして集計（useMemoで派生）
  const filtered = useMemo(
    () => (selectedChildId ? allLogs.filter((l) => l.child_id === selectedChildId) : []),
    [selectedChildId, allLogs]
  );
  const monthlyCounts = useMemo(() => calcMonthlyCounts(filtered), [filtered]);
  const monthlyMoods = useMemo(() => calcMonthlyMoods(filtered), [filtered]);
  const categoryCounts = useMemo(() => calcCategoryCounts(filtered), [filtered]);

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

      {/* 子ども切り替え */}
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
        <div className="space-y-8">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <MonthlyCountChart data={monthlyCounts} />
          </div>
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <MoodTrendChart data={monthlyMoods} />
          </div>
          {categoryCounts.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm">
              <CategoryPieChart data={categoryCounts} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
