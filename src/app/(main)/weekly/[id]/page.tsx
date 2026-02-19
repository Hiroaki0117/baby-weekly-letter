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
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl animate-bounce">📖</span>
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/weekly")}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        ← 一覧に戻る
      </Button>

      <Card className="overflow-hidden shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-orange-400 to-yellow-400" />
        <CardContent className="p-6">
          <div className="whitespace-pre-wrap leading-relaxed text-sm text-foreground">
            {report.content}
          </div>
        </CardContent>
      </Card>

      <PhotoGallery
        weekStart={report.week_start}
        weekEnd={report.week_end}
      />

      <Button
        variant="outline"
        className="w-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
        onClick={handleRegenerate}
        disabled={regenerating}
      >
        {regenerating ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">✨</span>
            再生成中...
          </span>
        ) : (
          "✨ 再生成する"
        )}
      </Button>
    </div>
  );
}
