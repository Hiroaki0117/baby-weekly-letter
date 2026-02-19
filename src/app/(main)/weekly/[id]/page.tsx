"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toDateString } from "@/lib/date";
import { PhotoGallery } from "@/components/weekly/photo-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { WeeklyReport } from "@/types";

export default function WeeklyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const supabase = createClient();

  const fetchReport = useCallback(async () => {
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("id", params.id as string)
      .single();

    if (error || !data) {
      toast.error("通信が見つかりませんでした");
      router.push("/weekly");
      return;
    }

    setReport(data as WeeklyReport);
    setLoading(false);
  }, [supabase, params.id, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function handleRegenerate() {
    if (!report) return;
    setRegenerating(true);

    try {
      const res = await fetch("/api/weekly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: toDateString(new Date(report.week_start)),
          weekEnd: toDateString(new Date(report.week_end)),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "再生成に失敗しました");
        return;
      }

      toast.success("週次通信を再生成しました");
      setReport(data);
    } catch {
      toast.error("再生成に失敗しました。再度お試しください");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/weekly")}>
        ← 一覧に戻る
      </Button>

      <Card>
        <CardContent className="whitespace-pre-wrap p-6 leading-relaxed">
          {report.content}
        </CardContent>
      </Card>

      <PhotoGallery
        weekStart={report.week_start}
        weekEnd={report.week_end}
      />

      <Button
        variant="outline"
        className="w-full"
        onClick={handleRegenerate}
        disabled={regenerating}
      >
        {regenerating ? "再生成中..." : "再生成する"}
      </Button>
    </div>
  );
}
