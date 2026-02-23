"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekRange, toDateString, formatMonthJa } from "@/lib/date";
import { WeeklyReportCard } from "@/components/weekly/weekly-report-card";
import { ReportTabs } from "@/components/weekly/report-tabs";
import { MonthlyReportCard } from "@/components/monthly/monthly-report-card";
import { toast } from "sonner";
import type { WeeklyReport, MonthlyReport } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

export default function WeeklyListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground">読み込み中...</p>
        </div>
      }
    >
      <WeeklyListPageInner />
    </Suspense>
  );
}

function WeeklyListPageInner() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "monthly" ? "monthly" : "weekly";

  const [activeTab, setActiveTab] = useState<"weekly" | "monthly">(initialTab);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .order("week_start", { ascending: false });

    if (error) {
      toast.error("通信の取得に失敗しました");
      return;
    }

    setReports((data as WeeklyReport[]) ?? []);
  }, [supabase]);

  const fetchMonthlyReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("monthly_reports")
      .select("*")
      .order("month", { ascending: false });

    if (error) {
      toast.error("月次まとめの取得に失敗しました");
      return;
    }

    setMonthlyReports((data as MonthlyReport[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    Promise.all([fetchReports(), fetchMonthlyReports()]).then(() => {
      setLoading(false);
    });
  }, [fetchReports, fetchMonthlyReports]);

  function handleTabChange(tab: "weekly" | "monthly") {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "monthly") {
      params.set("tab", "monthly");
    } else {
      params.delete("tab");
    }
    router.replace(`/weekly?${params.toString()}`);
  }

  async function handleGenerateWeekly() {
    setGenerating(true);

    const { start, end } = getWeekRange(new Date());
    const weekStart = toDateString(start);
    const weekEnd = toDateString(end);

    try {
      const res = await fetch("/api/weekly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, weekEnd }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "生成に失敗しました");
        return;
      }

      toast.success("週次通信を生成しました");
      router.push(`/weekly/${data.id}`);
    } catch {
      toast.error("生成に失敗しました。再度お試しください");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateMonthly() {
    setGenerating(true);

    const now = new Date();
    const month = format(now, "yyyy-MM");

    try {
      const res = await fetch("/api/monthly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "生成に失敗しました");
        return;
      }

      toast.success("月次まとめを生成しました");
      router.push(`/weekly/monthly/${data.id}`);
    } catch {
      toast.error("生成に失敗しました。再度お試しください");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  const now = new Date();
  const currentMonthLabel = formatMonthJa(now.getFullYear(), now.getMonth());

  return (
    <div className="space-y-5">
      {/* ページヘッダー */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {activeTab === "weekly" ? "Weekly Letters" : "Monthly Essays"}
          </p>
          <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
            {activeTab === "weekly" ? "週次通信" : "月次まとめ"}
          </h1>
        </div>
        {activeTab === "weekly" ? (
          <button
            onClick={handleGenerateWeekly}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <span className="text-base leading-none">✉</span>
                今週の通信を作る
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleGenerateMonthly}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <span className="text-base leading-none">📖</span>
                {currentMonthLabel}のまとめを作る
              </>
            )}
          </button>
        )}
      </div>

      {/* タブ切替 */}
      <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="h-px bg-border/60" />

      {/* 週次タブ */}
      {activeTab === "weekly" && (
        <>
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border">
                <div className="airmail-stripe absolute inset-x-0 top-0 h-2.5" />
                <span className="mt-2 text-3xl">✉</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  まだ週次通信がありません
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  ログを記録したら「今週の通信を作る」を押してみましょう
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <WeeklyReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 月次タブ */}
      {activeTab === "monthly" && (
        <>
          {monthlyReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative flex h-20 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border">
                <div className="h-2.5 w-full bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20 absolute inset-x-0 top-0" />
                <span className="mt-2 text-3xl">📖</span>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  まだ月次まとめがありません
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  週次通信が作られたら「まとめを作る」を押してみましょう
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyReports.map((report) => (
                <MonthlyReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
