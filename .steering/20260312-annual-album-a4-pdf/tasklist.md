# タスクリスト: 年次アルバムのA4印刷対応PDF出力

## 1. プロンプト修正

- [ ] 1-1. `src/lib/annual-report/prompt.ts` の closingMessage ルールに300文字以内の制約を追加

## 2. PDF出力関数

- [ ] 2-1. `src/lib/export.ts` に `exportAsA4Pdf` 関数を追加

## 3. PDF用レイアウトコンポーネント

- [ ] 3-1. `src/components/annual/annual-pdf-layout.tsx` を新規作成
  - ページ1: 表紙（タイトル、年齢、写真コラージュ）
  - ページ2〜4: 月別ハイライト（1ページ4ヶ月 × 3ページ）
  - ページ5: マイルストーン（最大15件）+ 成長記録
  - ページ6: 締めのメッセージ

## 4. アルバムビュー改修

- [ ] 4-1. `src/components/annual/annual-album-view.tsx` を改修
  - AnnualPdfLayout を非表示で描画
  - handleExportPdf を exportAsA4Pdf に切り替え

## 5. 品質チェック

- [ ] 5-1. `pnpm lint` / `pnpm type-check` / `pnpm test` を実行
- [ ] 5-2. commit & push
