"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toDateString, formatWeekRange } from "@/lib/date";
import { PhotoGallery } from "@/components/weekly/photo-gallery";
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">読み込み中…</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* 戻るリンク */}
      <button
        onClick={() => router.push("/weekly")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 通信一覧へ
      </button>

      {/* 手紙カード */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md shadow-primary/8">
        {/* エアメールストライプ上部 */}
        <div className="airmail-stripe h-3 w-full" />

        {/* 消印エリア */}
        <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-primary/60 bg-primary/6">
              <span className="text-sm">✉</span>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Weekly Letter
              </p>
              <p className="font-mincho text-sm font-semibold text-foreground">
                {formatWeekRange(report.week_start, report.week_end)}
              </p>
            </div>
          </div>
          {/* ポストマーク風スタンプ */}
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-muted-foreground/20 text-center">
            <p className="text-[8px] font-bold leading-none text-muted-foreground/40 tracking-tight">
              SUKUSUKU
            </p>
            <div className="my-0.5 h-px w-8 bg-muted-foreground/20" />
            <p className="text-[7px] leading-none text-muted-foreground/30">
              DIARY
            </p>
          </div>
        </div>

        {/* 本文（便箋風） */}
        <div
          className="px-6 py-6"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.85 0.015 5 / 0.2) 1px, transparent 1px)",
            backgroundSize: "100% 1.75rem",
            backgroundPositionY: "1.5rem",
          }}
        >
          <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
            {report.content}
          </div>
        </div>
      </div>

      {/* フォトギャラリー */}
      <PhotoGallery weekStart={report.week_start} weekEnd={report.week_end} />

      {/* 再生成ボタン */}
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-card py-3 text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
      >
        {regenerating ? (
          <>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
            再生成中…
          </>
        ) : (
          "✨ 再生成する"
        )}
      </button>
    </div>
  );
}
