"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { exportAsPdf } from "@/lib/export";
import { toast } from "sonner";
import type { AnnualReport, AnnualReportContent } from "@/types";

type AnnualAlbumViewProps = {
  report: AnnualReport;
  onBack: () => void;
};

const MONTH_NAMES: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

export function AnnualAlbumView({ report, onBack }: AnnualAlbumViewProps) {
  const content = report.content;
  const [photoUrls, setPhotoUrls] = useState<Map<number, string>>(new Map());
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // 写真の signed URL を取得
  useEffect(() => {
    async function fetchUrls() {
      const supabase = createClient();
      const paths = content.monthHighlights
        .filter((h) => h.photoPath)
        .map((h) => h.photoPath as string);

      if (paths.length === 0) return;

      const { data } = await supabase.storage
        .from("log-photos")
        .createSignedUrls(paths, 3600);

      if (!data) return;

      const urlMap = new Map<number, string>();
      for (const highlight of content.monthHighlights) {
        if (!highlight.photoPath) continue;
        const signed = data.find((d) => d.path === highlight.photoPath);
        if (signed) {
          urlMap.set(highlight.month, signed.signedUrl);
        }
      }
      setPhotoUrls(urlMap);
    }

    fetchUrls();
  }, [content.monthHighlights]);

  async function handleExportPdf() {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await exportAsPdf(
        exportRef.current,
        `すくすく日記_${report.fiscal_year}年度アルバム.pdf`,
      );
      toast.success("PDFをダウンロードしました");
    } catch {
      toast.error("PDF生成に失敗しました");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← 年次一覧に戻る
      </button>

      {/* アルバム本体 */}
      <div ref={exportRef} className="space-y-6 rounded-2xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm">
        {/* 表紙 */}
        <div className="text-center space-y-2 pb-6 border-b border-border/40">
          <p className="text-3xl">📚</p>
          <h2 className="font-mincho text-xl font-bold text-foreground">
            {content.coverTitle}
          </h2>
          {content.childAge && (
            <p className="text-sm text-muted-foreground">{content.childAge}</p>
          )}
        </div>

        {/* 月ごとのハイライト */}
        <div className="space-y-6">
          {content.monthHighlights.map((highlight) => (
            <MonthSection
              key={highlight.month}
              highlight={highlight}
              photoUrl={photoUrls.get(highlight.month)}
            />
          ))}
        </div>

        {/* マイルストーン */}
        {content.milestones.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border/40">
            <h3 className="font-mincho text-base font-semibold text-foreground flex items-center gap-2">
              <span>🌟</span> 初めてできたこと
            </h3>
            <ul className="space-y-2">
              {content.milestones.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60" />
                  <div>
                    <span className="text-foreground">{m.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {m.date}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 成長データ */}
        {content.growthSummary && (
          <GrowthSummarySection summary={content.growthSummary} />
        )}

        {/* 総括メッセージ */}
        <div className="space-y-2 pt-4 border-t border-border/40">
          <h3 className="font-mincho text-base font-semibold text-foreground flex items-center gap-2">
            <span>🧡</span> 1年の振り返り
          </h3>
          <p className="text-sm leading-7 text-foreground/90 whitespace-pre-wrap">
            {content.closingMessage}
          </p>
        </div>
      </div>

      {/* PDFダウンロードボタン */}
      <button
        onClick={handleExportPdf}
        disabled={exporting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-card py-3 text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
      >
        {exporting ? (
          <>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
            PDF生成中...
          </>
        ) : (
          <>
            <span>📄</span>
            PDFでダウンロード
          </>
        )}
      </button>
    </div>
  );
}

function MonthSection({
  highlight,
  photoUrl,
}: {
  highlight: AnnualReportContent["monthHighlights"][number];
  photoUrl?: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-mincho text-sm font-semibold text-primary/80">
        {MONTH_NAMES[highlight.month]}
      </h3>
      <div className="flex gap-4 items-start">
        {photoUrl && (
          <img
            src={photoUrl}
            alt={`${MONTH_NAMES[highlight.month]}の写真`}
            className="h-20 w-20 flex-shrink-0 rounded-lg object-cover shadow-sm"
            crossOrigin="anonymous"
          />
        )}
        <p className="text-sm leading-7 text-foreground/90 flex-1">
          {highlight.text}
        </p>
      </div>
    </div>
  );
}

function GrowthSummarySection({
  summary,
}: {
  summary: NonNullable<AnnualReportContent["growthSummary"]>;
}) {
  const hasHeight = summary.startHeight != null && summary.endHeight != null;
  const hasWeight = summary.startWeight != null && summary.endWeight != null;

  if (!hasHeight && !hasWeight) return null;

  return (
    <div className="space-y-3 pt-4 border-t border-border/40">
      <h3 className="font-mincho text-base font-semibold text-foreground flex items-center gap-2">
        <span>📏</span> 成長の記録
      </h3>
      <div className="flex gap-6 text-sm">
        {hasHeight && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">身長</p>
            <p className="text-foreground">
              {summary.startHeight}cm → {summary.endHeight}cm
              <span className="ml-1 text-xs text-primary">
                (+{(summary.endHeight! - summary.startHeight!).toFixed(1)}cm)
              </span>
            </p>
          </div>
        )}
        {hasWeight && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">体重</p>
            <p className="text-foreground">
              {summary.startWeight}kg → {summary.endWeight}kg
              <span className="ml-1 text-xs text-primary">
                (+{(summary.endWeight! - summary.startWeight!).toFixed(1)}kg)
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
