"use client";

import { formatWeekRange } from "@/lib/date";

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const PAGE_PADDING = 40;

type WeeklyPdfLayoutProps = {
  weekStart: string;
  weekEnd: string;
  content: string;
  photoUrls: string[];
  pageRef: (el: HTMLDivElement | null) => void;
};

export function WeeklyPdfLayout({
  weekStart,
  weekEnd,
  content,
  photoUrls,
  pageRef,
}: WeeklyPdfLayoutProps) {
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
      {/* エアメールストライプ */}
      <div
        style={{
          height: 12,
          width: "100%",
          marginBottom: 0,
          background:
            "repeating-linear-gradient(135deg, #c0392b 0px, #c0392b 10px, #ffffff 10px, #ffffff 20px, #2c3e88 20px, #2c3e88 30px, #ffffff 30px, #ffffff 40px)",
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
            ✉ Weekly Letter
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#333",
            }}
          >
            {formatWeekRange(weekStart, weekEnd)}
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
            "linear-gradient(rgba(212, 131, 122, 0.1) 1px, transparent 1px)",
          backgroundSize: "100% 1.75rem",
          backgroundPositionY: "1.5rem",
        }}
      >
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 13,
            lineHeight: "1.75rem",
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
            📷 この週の写真
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
