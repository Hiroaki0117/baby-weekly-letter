# 通信のPDF / 画像エクスポート - タスクリスト

## タスク一覧

### 1. セットアップ

- [ ] 1-1. html2canvas, jspdf をインストール

### 2. ユーティリティ

- [ ] 2-1. `src/lib/export.ts` を作成
  - `fetchPhotoUrls()` — 期間内の写真URL一括取得
  - `exportAsPng()` — DOM → Canvas → PNG ダウンロード
  - `exportAsPdf()` — DOM → Canvas → PDF ダウンロード
  - `buildExportFilename()` — ファイル名生成

### 3. UIコンポーネント

- [ ] 3-1. `src/components/export/export-layout.tsx` を作成
  - ヘッダー（アプリ名・期間）
  - 本文（便箋風罫線）
  - 写真セクション（3列グリッド）
  - フッター（ブランド表示）
- [ ] 3-2. `src/components/export/share-menu.tsx` を作成
  - 共有ボタン + ドロップダウンメニュー
  - 「画像で保存」「PDFで保存」の選択肢
  - エクスポート中のスピナー表示

### 4. 既存画面への組み込み

- [ ] 4-1. 週次通信詳細画面にエクスポート機能を組み込み
  - ShareMenu 配置
  - 写真取得 → ExportLayout 描画 → キャプチャ → ダウンロード
- [ ] 4-2. 月次まとめ詳細画面にエクスポート機能を組み込み
  - 同様の処理

### 5. 品質チェック

- [ ] 5-1. lint / type-check / test の実施・修正
- [ ] 5-2. 実際のエクスポート出力を確認（PNG / PDF）
