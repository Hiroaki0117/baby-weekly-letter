"use client";

import { useCallback } from "react";
import type { AnnualReportContent } from "@/types";

// A4比率: 210mm × 297mm → 794px × 1123px (96dpi相当)
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_PADDING = 40;

const MONTH_NAMES: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

// 年度順の月
const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

type AnnualPdfLayoutProps = {
  content: AnnualReportContent;
  photoUrls: Map<number, string>;
  pagesRef: React.MutableRefObject<HTMLDivElement[]>;
};

function PageContainer({
  children,
  refCallback,
}: {
  children: React.ReactNode;
  refCallback: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={refCallback}
      style={{
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        padding: PAGE_PADDING,
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
      className="flex flex-col"
    >
      {children}
    </div>
  );
}

export function AnnualPdfLayout({ content, photoUrls, pagesRef }: AnnualPdfLayoutProps) {
  const setPageRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (el) pagesRef.current[index] = el;
    },
    [pagesRef],
  );

  // 写真があるURLを収集（最大6枚）
  const collagePhotos: { month: number; url: string }[] = [];
  for (const m of FISCAL_MONTHS) {
    const url = photoUrls.get(m);
    if (url && collagePhotos.length < 6) {
      collagePhotos.push({ month: m, url });
    }
  }

  // 月別ハイライトを月番号でマップ化
  const highlightMap = new Map(content.monthHighlights.map((h) => [h.month, h]));

  // マイルストーンを最大15件に制限
  const milestones = content.milestones.slice(0, 15);

  return (
    <div
      style={{ position: "absolute", left: -9999, top: 0 }}
      aria-hidden="true"
    >
      {/* ページ1: 表紙 */}
      <PageContainer refCallback={setPageRef(0)}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-6 text-5xl">📚</p>
          <h1
            className="mb-3 text-3xl font-bold text-gray-800"
            style={{ fontFamily: "serif" }}
          >
            {content.coverTitle}
          </h1>
          {content.childAge && (
            <p className="mb-10 text-lg text-gray-500">{content.childAge}</p>
          )}

          {/* 写真コラージュ */}
          {collagePhotos.length > 0 && (
            <CoverCollage photos={collagePhotos} />
          )}
        </div>
      </PageContainer>

      {/* ページ2〜4: 月別ハイライト */}
      {[0, 1, 2].map((pageIdx) => {
        const months = FISCAL_MONTHS.slice(pageIdx * 4, pageIdx * 4 + 4);
        return (
          <PageContainer key={pageIdx} refCallback={setPageRef(pageIdx + 1)}>
            <div className="flex flex-1 flex-col">
              {months.map((m, i) => {
                const highlight = highlightMap.get(m);
                const url = photoUrls.get(m);
                return (
                  <div
                    key={m}
                    className="flex flex-1 flex-col justify-center"
                    style={{
                      borderTop: i > 0 ? "1px solid #e5e7eb" : undefined,
                      paddingTop: i > 0 ? 16 : 0,
                      paddingBottom: 16,
                    }}
                  >
                    <h3
                      className="mb-2 text-base font-semibold"
                      style={{ fontFamily: "serif", color: "#6366f1" }}
                    >
                      {MONTH_NAMES[m]}
                    </h3>
                    <div className="flex items-start gap-4">
                      {url ? (
                        <img
                          src={url}
                          alt={`${MONTH_NAMES[m]}の写真`}
                          className="rounded-lg object-cover shadow-sm"
                          style={{ width: 120, height: 120, flexShrink: 0 }}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center rounded-lg bg-gray-100"
                          style={{ width: 120, height: 120, flexShrink: 0 }}
                        >
                          <span className="text-3xl text-gray-300">📷</span>
                        </div>
                      )}
                      <p className="flex-1 text-sm leading-7 text-gray-700">
                        {highlight?.text ?? "この月の記録はありません"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </PageContainer>
        );
      })}

      {/* ページ5: マイルストーン + 成長記録 */}
      <PageContainer refCallback={setPageRef(4)}>
        <div className="flex flex-1 flex-col">
          {/* マイルストーン */}
          <div className="mb-8">
            <h3
              className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800"
              style={{ fontFamily: "serif" }}
            >
              <span>🌟</span> 初めてできたこと
            </h3>
            {milestones.length > 0 ? (
              <ul className="space-y-2">
                {milestones.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
                    <div>
                      <span className="text-gray-800">{m.title}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {m.date}
                      </span>
                    </div>
                  </li>
                ))}
                {content.milestones.length > 15 && (
                  <li className="text-xs text-gray-400">
                    ...他 {content.milestones.length - 15} 件
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">マイルストーンの記録はありません</p>
            )}
          </div>

          {/* 成長記録 */}
          {content.growthSummary && (
            <div
              className="border-t border-gray-200 pt-6"
            >
              <h3
                className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800"
                style={{ fontFamily: "serif" }}
              >
                <span>📏</span> 成長の記録
              </h3>
              <PdfGrowthSummary summary={content.growthSummary} />
            </div>
          )}
        </div>
      </PageContainer>

      {/* ページ6: 締めのメッセージ */}
      <PageContainer refCallback={setPageRef(5)}>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h3
            className="mb-8 flex items-center gap-2 text-xl font-semibold text-gray-800"
            style={{ fontFamily: "serif" }}
          >
            <span>🧡</span> 1年の振り返り
          </h3>
          <p
            className="max-w-lg text-base leading-8 text-gray-700 whitespace-pre-wrap"
            style={{ fontFamily: "serif" }}
          >
            {content.closingMessage}
          </p>
        </div>
      </PageContainer>
    </div>
  );
}

function CoverCollage({ photos }: { photos: { month: number; url: string }[] }) {
  const count = photos.length;

  // グリッド設定: 枚数に応じて調整
  let cols: number;
  if (count <= 2) cols = count;
  else if (count <= 4) cols = 2;
  else cols = 3;

  return (
    <div
      className="mx-auto grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        maxWidth: cols === 1 ? 240 : cols === 2 ? 400 : 540,
      }}
    >
      {photos.map((p) => (
        <img
          key={p.month}
          src={p.url}
          alt={`${MONTH_NAMES[p.month]}の写真`}
          className="aspect-square w-full rounded-lg object-cover shadow-sm"
          crossOrigin="anonymous"
        />
      ))}
    </div>
  );
}

function PdfGrowthSummary({
  summary,
}: {
  summary: NonNullable<AnnualReportContent["growthSummary"]>;
}) {
  const hasHeight = summary.startHeight != null && summary.endHeight != null;
  const hasWeight = summary.startWeight != null && summary.endWeight != null;

  if (!hasHeight && !hasWeight) return null;

  return (
    <div className="flex gap-12 text-sm">
      {hasHeight && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">身長</p>
          <p className="text-lg text-gray-800">
            {summary.startHeight}cm → {summary.endHeight}cm
            <span className="ml-2 text-sm text-indigo-500">
              (+{(summary.endHeight! - summary.startHeight!).toFixed(1)}cm)
            </span>
          </p>
        </div>
      )}
      {hasWeight && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">体重</p>
          <p className="text-lg text-gray-800">
            {summary.startWeight}kg → {summary.endWeight}kg
            <span className="ml-2 text-sm text-indigo-500">
              (+{(summary.endWeight! - summary.startWeight!).toFixed(1)}kg)
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
