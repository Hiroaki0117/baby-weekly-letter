# タスクリスト：週次・月次アルバム A4 PDF最適化

## フェーズ1: A4 PDFレイアウトコンポーネント

- [x] 1-1. `src/components/weekly/weekly-pdf-layout.tsx` 作成
  - A4固定サイズ（794×1123px）
  - エアメールストライプ + Weekly Letter ヘッダー + スタンプ
  - エッセイ本文（便箋風罫線背景）
  - 写真グリッド（3列×2行、最大6枚）
  - フッター
- [x] 1-2. `src/components/monthly/monthly-pdf-layout.tsx` 作成
  - A4固定サイズ（794×1123px）
  - グラデーションバー + Monthly Album ヘッダー + スタンプ
  - エッセイ本文（便箋風罫線背景）
  - 写真グリッド（3列×2行、最大6枚）
  - フッター

## フェーズ2: エクスポートフロー変更

- [x] 2-1. `src/app/(main)/weekly/[id]/page.tsx` — PDF時に WeeklyPdfLayout を使用
  - exportData に format 判別を追加
  - PDF: WeeklyPdfLayout → exportAsA4Pdf
  - PNG: ExportLayout → exportAsPng（変更なし）
- [x] 2-2. `src/app/(main)/weekly/monthly/[id]/page.tsx` — PDF時に MonthlyPdfLayout を使用
  - 同様にPDF時のみ MonthlyPdfLayout を使用

## フェーズ3: 品質チェック + デプロイ

- [x] 3-1. `pnpm lint` / `pnpm type-check` / `pnpm test`
- [ ] 3-2. commit + push
