import { forwardRef } from "react";

type ExportLayoutProps = {
  type: "weekly" | "monthly";
  title: string;
  content: string;
  photoUrls: string[];
};

export const ExportLayout = forwardRef<HTMLDivElement, ExportLayoutProps>(
  function ExportLayout({ type, title, content, photoUrls }, ref) {
    const typeLabel = type === "weekly" ? "Weekly Letter" : "Monthly Essay";
    const typeEmoji = type === "weekly" ? "✉" : "📖";

    return (
      <div
        ref={ref}
        style={{
          width: 800,
          fontFamily:
            "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
          backgroundColor: "#ffffff",
          color: "#1a1a1a",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            padding: "32px 40px 24px",
            borderBottom: "2px solid #f0e6e0",
            background: "linear-gradient(135deg, #fdf8f6 0%, #fef1ec 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>🍼</span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#d4837a",
              }}
            >
              すくすく日記
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: "#b0a0a0",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {typeEmoji} {typeLabel}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#333",
            }}
          >
            {title}
          </div>
        </div>

        {/* 本文 */}
        <div
          style={{
            padding: "28px 40px",
            backgroundImage:
              "linear-gradient(rgba(212, 131, 122, 0.1) 1px, transparent 1px)",
            backgroundSize: "100% 1.75rem",
            backgroundPositionY: "1.5rem",
          }}
        >
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 14,
              lineHeight: "1.75rem",
              color: "rgba(26, 26, 26, 0.88)",
            }}
          >
            {content}
          </div>
        </div>

        {/* 写真セクション */}
        {photoUrls.length > 0 && (
          <div
            style={{
              padding: "20px 40px 28px",
              borderTop: "1px solid #f0e6e0",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#888",
                marginBottom: 12,
              }}
            >
              📷 {type === "weekly" ? "この週" : "この月"}の写真
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {photoUrls.map((url, i) => (
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
                    borderRadius: 8,
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
            padding: "16px 40px",
            borderTop: "2px solid #f0e6e0",
            textAlign: "center",
            fontSize: 11,
            color: "#b0a0a0",
          }}
        >
          すくすく日記で作成
        </div>
      </div>
    );
  }
);
