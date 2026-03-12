"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { exportAsA4Pdf } from "@/lib/export";
import { AnnualPdfLayout } from "./annual-pdf-layout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AnnualReport, AnnualReportContent } from "@/types";

type AnnualAlbumViewProps = {
  report: AnnualReport;
  onBack: () => void;
};

const MONTH_NAMES: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

const TOTAL_PAGES = 6;

const PAGE_LABELS = [
  "表紙",
  "4月〜7月",
  "8月〜11月",
  "12月〜3月",
  "マイルストーン",
  "振り返り",
];

export function AnnualAlbumView({ report, onBack }: AnnualAlbumViewProps) {
  const content = report.content;
  const [photoUrls, setPhotoUrls] = useState<Map<number, string>>(new Map());
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const pdfPagesRef = useRef<HTMLDivElement[]>([]);

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

  function goToPage(page: number) {
    if (page < 0 || page >= TOTAL_PAGES || page === currentPage) return;
    setSlideDirection(page > currentPage ? "left" : "right");
    setCurrentPage(page);
  }

  async function handleExportPdf() {
    const pages = pdfPagesRef.current.filter(Boolean);
    if (pages.length === 0) return;
    setExporting(true);
    try {
      await exportAsA4Pdf(
        pages,
        `すくすく日記_${report.fiscal_year}年度アルバム.pdf`,
      );
      toast.success("PDFをダウンロードしました");
    } catch {
      toast.error("PDF生成に失敗しました");
    } finally {
      setExporting(false);
    }
  }

  // 月別ハイライトをマップ化
  const highlightMap = new Map(content.monthHighlights.map((h) => [h.month, h]));

  // コラージュ用写真
  const collagePhotos: { month: number; url: string }[] = [];
  for (const m of FISCAL_MONTHS) {
    const url = photoUrls.get(m);
    if (url && collagePhotos.length < 6) {
      collagePhotos.push({ month: m, url });
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

      {/* PDF用非表示レイアウト */}
      <AnnualPdfLayout
        content={content}
        photoUrls={photoUrls}
        pagesRef={pdfPagesRef}
      />

      {/* ページめくりUI */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {/* ページコンテンツ */}
        <div className="relative min-h-[400px]">
          <div
            key={currentPage}
            className={cn(
              "animate-in duration-300 fill-mode-both",
              slideDirection === "left" && "slide-in-from-right-5 fade-in",
              slideDirection === "right" && "slide-in-from-left-5 fade-in",
              slideDirection === null && "fade-in",
            )}
          >
            {currentPage === 0 && (
              <CoverPage content={content} collagePhotos={collagePhotos} />
            )}
            {currentPage >= 1 && currentPage <= 3 && (
              <MonthHighlightsPage
                months={FISCAL_MONTHS.slice((currentPage - 1) * 4, (currentPage - 1) * 4 + 4)}
                highlightMap={highlightMap}
                photoUrls={photoUrls}
              />
            )}
            {currentPage === 4 && (
              <MilestonePage content={content} />
            )}
            {currentPage === 5 && (
              <ClosingPage content={content} />
            )}
          </div>
        </div>

        {/* ページナビゲーション */}
        <div className="flex items-center justify-between border-t border-border/40 px-5 py-3">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors",
              currentPage === 0
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            ← 前へ
          </button>

          <span className="text-xs text-muted-foreground">
            {currentPage + 1} / {TOTAL_PAGES}
            <span className="ml-2 hidden sm:inline">— {PAGE_LABELS[currentPage]}</span>
          </span>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === TOTAL_PAGES - 1}
            className={cn(
              "flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors",
              currentPage === TOTAL_PAGES - 1
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            次へ →
          </button>
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

/* ===== ページコンポーネント ===== */

function CoverPage({
  content,
  collagePhotos,
}: {
  content: AnnualReportContent;
  collagePhotos: { month: number; url: string }[];
}) {
  let cols: number;
  if (collagePhotos.length <= 2) cols = collagePhotos.length || 1;
  else if (collagePhotos.length <= 4) cols = 2;
  else cols = 3;

  return (
    <div className="flex flex-col items-center px-5 py-12 sm:px-8 sm:py-16 text-center">
      <p className="mb-4 text-4xl">📚</p>
      <h2 className="font-mincho text-xl sm:text-2xl font-bold text-foreground mb-2">
        {content.coverTitle}
      </h2>
      {content.childAge && (
        <p className="text-sm text-muted-foreground mb-8">{content.childAge}</p>
      )}

      {collagePhotos.length > 0 && (
        <div
          className="mx-auto grid gap-2 sm:gap-3"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: cols === 1 ? 200 : cols === 2 ? 320 : 420,
          }}
        >
          {collagePhotos.map((p) => (
            <img
              key={p.month}
              src={p.url}
              alt={`${MONTH_NAMES[p.month]}の写真`}
              className="aspect-square w-full rounded-lg object-cover shadow-sm"
              crossOrigin="anonymous"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MonthHighlightsPage({
  months,
  highlightMap,
  photoUrls,
}: {
  months: number[];
  highlightMap: Map<number, AnnualReportContent["monthHighlights"][number]>;
  photoUrls: Map<number, string>;
}) {
  return (
    <div className="divide-y divide-border/40 px-5 sm:px-8">
      {months.map((m) => {
        const highlight = highlightMap.get(m);
        const url = photoUrls.get(m);
        return (
          <div key={m} className="py-5 sm:py-6">
            <h3 className="font-mincho text-sm font-semibold text-primary/80 mb-2">
              {MONTH_NAMES[m]}
            </h3>
            <div className="flex gap-4 items-start">
              {url ? (
                <img
                  src={url}
                  alt={`${MONTH_NAMES[m]}の写真`}
                  className="h-20 w-20 flex-shrink-0 rounded-lg object-cover shadow-sm"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <span className="text-2xl text-muted-foreground/30">📷</span>
                </div>
              )}
              <p className="flex-1 text-sm leading-7 text-foreground/90">
                {highlight?.text ?? "この月の記録はありません"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MilestonePage({ content }: { content: AnnualReportContent }) {
  const milestones = content.milestones.slice(0, 15);

  return (
    <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
      {/* マイルストーン */}
      <div>
        <h3 className="font-mincho text-base font-semibold text-foreground flex items-center gap-2 mb-4">
          <span>🌟</span> 初めてできたこと
        </h3>
        {milestones.length > 0 ? (
          <ul className="space-y-2">
            {milestones.map((m, i) => (
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
            {content.milestones.length > 15 && (
              <li className="text-xs text-muted-foreground">
                ...他 {content.milestones.length - 15} 件
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">マイルストーンの記録はありません</p>
        )}
      </div>

      {/* 成長データ */}
      {content.growthSummary && (
        <GrowthSummarySection summary={content.growthSummary} />
      )}
    </div>
  );
}

function ClosingPage({ content }: { content: AnnualReportContent }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 sm:px-8 sm:py-16 text-center">
      <h3 className="font-mincho text-base font-semibold text-foreground flex items-center gap-2 mb-6">
        <span>🧡</span> 1年の振り返り
      </h3>
      <p className="max-w-lg text-sm leading-8 text-foreground/90 whitespace-pre-wrap">
        {content.closingMessage}
      </p>
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
    <div className="border-t border-border/40 pt-6">
      <h3 className="font-mincho text-base font-semibold text-foreground flex items-center gap-2 mb-4">
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
