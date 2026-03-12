# 設計書：週次・月次アルバム A4 PDF最適化

## 1. アプローチ

年次アルバムの `AnnualPdfLayout` と同じパターンを採用する。

- PDF専用のA4レイアウトコンポーネントを新設
- 固定サイズ（794×1123px）のDOMを非表示で描画
- `exportAsA4Pdf()` で DOM → PNG → PDF 変換

既存の `ExportLayout` は PNG エクスポート用としてそのまま残す。

## 2. 週次 A4 PDF レイアウト

```
┌─────────────────────────────────────────────────┐ ← 794px
│ ▓▓▓ エアメールストライプ（赤白青）▓▓▓          │ 12px
├─────────────────────────────────────────────────┤
│                                                 │
│  ✉ Weekly Letter          ┌─────┐             │
│  3月9日〜3月15日          │SUKUSUKU│            │ ~70px
│                            │ DIARY │            │
│                            └─────┘             │
├─────────────────────────────────────────────────┤
│  ─────────────────────────────────────────────  │
│  🌟 今週のハイライト                            │
│  今週は初めてのハイハイに成功しました...        │
│  ─────────────────────────────────────────────  │
│  📝 日々のダイジェスト                          │
│  月曜日は...                                    │ ~650px
│  ─────────────────────────────────────────────  │
│  ...                                            │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐                      │
│  │ 📷  │ │ 📷  │ │ 📷  │                      │ ~250px
│  └─────┘ └─────┘ └─────┘                      │
│  ┌─────┐ ┌─────┐ ┌─────┐                      │
│  │ 📷  │ │ 📷  │ │ 📷  │                      │
│  └─────┘ └─────┘ └─────┘                      │
├─────────────────────────────────────────────────┤
│  🍼 すくすく日記                                │ ~30px
└─────────────────────────────────────────────────┘
                                              1123px
```

## 3. 月次 A4 PDF レイアウト

```
┌─────────────────────────────────────────────────┐
│ ████ グラデーションバー ████████████████         │ 12px
├─────────────────────────────────────────────────┤
│                                                 │
│  📖 Monthly Album         ┌─────┐             │
│  2026年3月のアルバム      │SUKUSUKU│            │ ~70px
│                            │ DIARY │            │
│                            └─────┘             │
├─────────────────────────────────────────────────┤
│                                                 │
│  エッセイ本文                                   │
│  ...                                            │ ~650px
│                                                 │
├─────────────────────────────────────────────────┤
│  写真グリッド（最大6枚）                         │ ~250px
├─────────────────────────────────────────────────┤
│  🍼 すくすく日記                                │ ~30px
└─────────────────────────────────────────────────┘
```

## 4. 実装構造

### 新規コンポーネント

```typescript
// src/components/weekly/weekly-pdf-layout.tsx
type WeeklyPdfLayoutProps = {
  weekStart: string;
  weekEnd: string;
  content: string;
  photoUrls: string[];
  pageRef: React.RefCallback<HTMLDivElement>;
};
```

```typescript
// src/components/monthly/monthly-pdf-layout.tsx
type MonthlyPdfLayoutProps = {
  month: string;       // "YYYY-MM-DD"
  content: string;
  photoUrls: string[];
  pageRef: React.RefCallback<HTMLDivElement>;
};
```

### ページ定数（年次と共通）

```typescript
const PAGE_WIDTH = 794;   // A4幅 (96dpi)
const PAGE_HEIGHT = 1123; // A4高さ (96dpi)
const PAGE_PADDING = 40;  // ページ余白
```

## 5. エクスポートフローの変更

### 変更前（現状）
```
PDF ボタン → fetchPhotoUrls() → ExportLayout 描画 → exportAsPdf(el, filename)
```

`exportAsPdf` は単一DOM要素を画像化してPDFにする。A4最適化なし。

### 変更後
```
PDF ボタン → fetchPhotoUrls() → WeeklyPdfLayout 描画 → exportAsA4Pdf([page], filename)
```

`exportAsA4Pdf` を再利用。ページ配列は1要素のみ。

### PNG エクスポート
```
PNG ボタン → fetchPhotoUrls() → ExportLayout 描画 → exportAsPng(el, filename)
```
変更なし。従来通り。

## 6. 詳細ページの変更

### `src/app/(main)/weekly/[id]/page.tsx`

```typescript
// 変更前
const [exportData, setExportData] = useState<{
  photoUrls: string[];
  format: "png" | "pdf";
} | null>(null);

// PDF/PNG 両方とも ExportLayout を使用

// 変更後
// PDF の場合は WeeklyPdfLayout を使用
// PNG の場合は ExportLayout を使用（従来通り）
```

### `src/app/(main)/weekly/monthly/[id]/page.tsx`

同様に PDF 時のみ `MonthlyPdfLayout` を使用。

## 7. 写真の制限

- A4レイアウトの写真グリッドは**最大6枚**
- 3列 × 2行
- 7枚以上ある場合は先頭6枚を使用
- 写真がない場合は写真セクションを非表示にし、本文エリアを拡張

## 8. 変更対象ファイル一覧

### 新規作成
| ファイル | 内容 |
|---------|------|
| `src/components/weekly/weekly-pdf-layout.tsx` | 週次A4 PDFレイアウト |
| `src/components/monthly/monthly-pdf-layout.tsx` | 月次A4 PDFレイアウト |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/weekly/[id]/page.tsx` | PDF時に WeeklyPdfLayout を使用 |
| `src/app/(main)/weekly/monthly/[id]/page.tsx` | PDF時に MonthlyPdfLayout を使用 |
