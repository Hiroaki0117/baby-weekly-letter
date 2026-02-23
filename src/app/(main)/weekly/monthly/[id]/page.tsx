"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatMonthJa } from "@/lib/date";
import { MonthlyPhotoGallery } from "@/components/monthly/monthly-photo-gallery";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import type { MonthlyReport } from "@/types";

export default function MonthlyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const supabase = createClient();

  const fetchReport = useCallback(async () => {
    const { data, error } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("id", params.id as string)
      .single();

    if (error || !data) {
      toast.error("まとめが見つかりませんでした");
      router.push("/weekly?tab=monthly");
      return;
    }

    setReport(data as MonthlyReport);
    setLoading(false);
  }, [supabase, params.id, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  async function handleRegenerate() {
    if (!report) return;
    setRegenerating(true);

    const date = parseISO(report.month);
    const month = format(date, "yyyy-MM");

    try {
      const res = await fetch("/api/monthly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "再生成に失敗しました");
        return;
      }

      toast.success("月次まとめを再生成しました");
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
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!report) return null;

  const date = parseISO(report.month);
  const monthLabel = formatMonthJa(date.getFullYear(), date.getMonth());

  return (
    <div className="space-y-6">
      {/* 戻るリンク */}
      <button
        onClick={() => router.push("/weekly?tab=monthly")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 月次まとめ一覧へ
      </button>

      {/* エッセイカード */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        {/* グラデーション上部バー */}
        <div className="h-3 w-full bg-gradient-to-r from-primary/60 via-primary/40 to-primary/20" />

        {/* ヘッダーエリア */}
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20">
              <span className="text-sm">📖</span>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Monthly Essay
              </p>
              <p className="font-mincho text-sm font-semibold text-foreground">
                {monthLabel}のまとめ
              </p>
            </div>
          </div>
          {/* スタンプ風 */}
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
              "linear-gradient(oklch(0.87 0.020 70 / 0.25) 1px, transparent 1px)",
            backgroundSize: "100% 2rem",
            backgroundPositionY: "1.75rem",
          }}
        >
          <div className="whitespace-pre-wrap text-sm leading-8 text-foreground/90">
            {report.content}
          </div>
        </div>
      </div>

      {/* フォトギャラリー */}
      <MonthlyPhotoGallery year={date.getFullYear()} month={date.getMonth()} />

      {/* 再生成ボタン */}
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card py-3 text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-muted/50 hover:text-primary disabled:opacity-50"
      >
        {regenerating ? (
          <>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
            再生成中...
          </>
        ) : (
          "✨ 再生成する"
        )}
      </button>
    </div>
  );
}
