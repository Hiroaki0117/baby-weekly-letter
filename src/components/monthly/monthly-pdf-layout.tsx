"use client";

import { parseISO } from "date-fns";
import { formatMonthJa } from "@/lib/date";

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_PADDING = 40;

type MonthlyPdfLayoutProps = {
  month: string; // "YYYY-MM-DD"
  content: string;
  photoUrls: string[];
  pageRef: (el: HTMLDivElement | null) => void;
};

export function MonthlyPdfLayout({
  month,
  content,
  photoUrls,
  pageRef,
}: MonthlyPdfLayoutProps) {
  const date = parseISO(month);
  const monthLabel = formatMonthJa(date.getFullYear(), date.getMonth());
  const photos = photoUrls.slice(0, 6);
  const hasPhotos = photos.length > 0;

  return (
    <div
      ref={pageRef}
      style={{
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        padding: PAGE_PADDING,
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        fontFamily:
          "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
        color: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* グラデーションバー */}
      <div
        style={{
          height: 12,
          width: "100%",
          background:
            "linear-gradient(to right, rgba(168, 85, 247, 0.6), rgba(168, 85, 247, 0.4), rgba(168, 85, 247, 0.2))",
          borderRadius: "2px 2px 0 0",
        }}
      />

      {/* ヘッダー */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0 14px",
          borderBottom: "1px solid #f0e6e0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            📖
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: "#b0a0a0",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Monthly Album
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#333",
              }}
            >
              {monthLabel}のアルバム
            </div>
          </div>
        </div>
        {/* スタンプ */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "2px solid #d0d0d0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 7, fontWeight: 700, color: "#c0c0c0", letterSpacing: 0.5 }}>
            SUKUSUKU
          </span>
          <div style={{ width: 32, height: 1, backgroundColor: "#d0d0d0", margin: "2px 0" }} />
          <span style={{ fontSize: 6, color: "#c8c8c8" }}>DIARY</span>
        </div>
      </div>

      {/* 本文 */}
      <div
        style={{
          flex: 1,
          padding: "16px 0",
          overflow: "hidden",
          backgroundImage:
            "linear-gradient(oklch(0.87 0.020 70 / 0.25) 1px, transparent 1px)",
          backgroundSize: "100% 2rem",
          backgroundPositionY: "1.75rem",
        }}
      >
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 13,
            lineHeight: "2rem",
            color: "rgba(26, 26, 26, 0.88)",
          }}
        >
          {content}
        </div>
      </div>

      {/* 写真グリッド */}
      {hasPhotos && (
        <div
          style={{
            borderTop: "1px solid #f0e6e0",
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#aaa",
              marginBottom: 8,
            }}
          >
            📷 この月の写真
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
            }}
          >
            {photos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
                  borderRadius: 6,
                  display: "block",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* フッター */}
      <div
        style={{
          borderTop: "1px solid #f0e6e0",
          paddingTop: 8,
          textAlign: "center",
          fontSize: 9,
          color: "#c0c0c0",
        }}
      >
        🍼 すくすく日記
      </div>
    </div>
  );
}
