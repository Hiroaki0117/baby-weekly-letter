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
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">週次通信</h1>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "生成中..." : "今週の通信を作る"}
        </Button>
      </div>

      {reports.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          まだ週次通信がありません
        </p>
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
