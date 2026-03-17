"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toDateString, formatWeekRange } from "@/lib/date";
import { fetchPhotoUrls, exportAsPng, exportAsA4Pdf, buildExportFilename } from "@/lib/export";
import { PhotoGallery } from "@/components/weekly/photo-gallery";
import { ShareMenu } from "@/components/export/share-menu";
import { ExportLayout } from "@/components/export/export-layout";
import { WeeklyPdfLayout } from "@/components/weekly/weekly-pdf-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { GeneratingOverlay } from "@/components/ui/generating-overlay";
import type { WeeklyReport } from "@/types";

export default function WeeklyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const pdfPageRef = useRef<HTMLDivElement | null>(null);
  const [exportData, setExportData] = useState<{ photoUrls: string[]; format: "png" | "pdf" } | null>(null);
  const supabase = createClient();

  const fetchReport = useCallback(async () => {
    const { data, error } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("id", params.id as string)
      .single();

    if (error || !data) {
      toast.error("アルバムが見つかりませんでした");
      router.push("/album?tab=weekly");
      return;
    }

    setReport(data as WeeklyReport);
    setLoading(false);
  }, [supabase, params.id, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ExportLayout が描画され、写真が読み込まれたらキャプチャ
  useEffect(() => {
    if (!exportData) return;

    async function doExport() {
      // ref がアタッチされるまで待つ
      await new Promise((r) => requestAnimationFrame(r));

      const isPdf = exportData!.format === "pdf";
      const el = isPdf ? pdfPageRef.current : exportRef.current;

      if (!el) {
        console.error("Export element ref is null");
        toast.error("エクスポートに失敗しました");
        setExportData(null);
        setExporting(false);
        return;
      }

      // 写真の読み込み完了を待つ
      const imgs = el.querySelectorAll("img");
      await Promise.all(
        Array.from(imgs).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
        )
      );

      // 少し待ってから描画（レイアウト安定のため）
      await new Promise((r) => setTimeout(r, 100));

      const dateLabel = `${report!.week_start}_${report!.week_end}`;
      const filename = buildExportFilename("weekly", dateLabel, exportData!.format);

      try {
        if (isPdf) {
          await exportAsA4Pdf([el], filename);
        } else {
          await exportAsPng(el, filename);
        }
        toast.success("エクスポートしました");
      } catch (err) {
        console.error("Export failed:", err);
        toast.error("エクスポートに失敗しました");
      } finally {
        setExportData(null);
        setExporting(false);
      }
    }

    doExport();
  }, [exportData, report]);

  async function handleExport(format: "png" | "pdf") {
    if (!report) return;
    setExporting(true);

    try {
      const photoUrls = await fetchPhotoUrls(supabase, report.week_start, report.week_end);
      setExportData({ photoUrls, format });
    } catch {
      toast.error("エクスポートの準備に失敗しました");
      setExporting(false);
    }
  }

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
          childId: report.child_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "再生成に失敗しました");
        return;
      }

      toast.success("週次アルバムを再生成しました");
      setReport(data);
    } catch {
      toast.error("再生成に失敗しました。再度お試しください");
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <LoadingSpinner />
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <GeneratingOverlay visible={regenerating} message="アルバムを再生成中です…" />

      {/* 戻るリンク */}
      <button
        onClick={() => router.push("/album?tab=weekly")}
        className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        アルバム一覧へ
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

      {/* 共有メニュー */}
      <ShareMenu onExport={handleExport} exporting={exporting} />

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

      {/* エクスポート用（視覚的に非表示だが描画可能） */}
      {exportData && (
        <div style={{ position: "fixed", left: 0, top: 0, zIndex: -9999, pointerEvents: "none" }}>
          {exportData.format === "pdf" ? (
            <WeeklyPdfLayout
              weekStart={report.week_start}
              weekEnd={report.week_end}
              content={report.content}
              photoUrls={exportData.photoUrls}
              pageRef={(el) => { pdfPageRef.current = el; }}
            />
          ) : (
            <ExportLayout
              ref={exportRef}
              type="weekly"
              title={formatWeekRange(report.week_start, report.week_end)}
              content={report.content}
              photoUrls={exportData.photoUrls}
            />
          )}
        </div>
      )}
    </div>
  );
}
