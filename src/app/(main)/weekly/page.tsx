"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekRange, toDateString } from "@/lib/date";
import { WeeklyReportCard } from "@/components/weekly/weekly-report-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WeeklyReport } from "@/types";
import { useRouter } from "next/navigation";

export default function WeeklyListPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
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
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleGenerate() {
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl animate-bounce">📮</span>
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ヘッダー + 生成ボタン */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📮</span>
            <div>
              <h1 className="text-xl font-bold">週次通信</h1>
              <p className="text-xs text-muted-foreground mt-0.5">今週の育児ハイライト</p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-primary hover:bg-primary/90 shadow-sm"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">✨</span>
                生成中...
              </span>
            ) : (
              "今週の通信を作る"
            )}
          </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <span className="text-5xl">✉️</span>
          <p className="text-muted-foreground">まだ週次通信がありません</p>
          <p className="text-xs text-muted-foreground">ログを記録したら「今週の通信を作る」を押してみましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <WeeklyReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
