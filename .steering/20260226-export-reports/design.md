# 通信のPDF / 画像エクスポート - 設計書

## 1. 技術選定

### ライブラリ

| ライブラリ | 用途 | 備考 |
|-----------|------|------|
| `html2canvas` | DOM → Canvas 変換（PNG生成） | クライアント側で完結、軽量 |
| `jspdf` | Canvas → PDF 変換 | html2canvas の出力をそのまま使える |

両方ともクライアント側で完結し、サーバーサイドの処理不要。

### 処理フロー

```
共有ボタンタップ
  → メニュー表示（画像で保存 / PDFで保存）
  → 選択
  → エクスポート用の非表示コンポーネントを描画
  → 写真の読み込み完了を待つ
  → html2canvas で Canvas に変換
  → PNG の場合: Canvas → Blob → ダウンロード
  → PDF の場合: Canvas → jsPDF に画像として追加 → ダウンロード
  → 非表示コンポーネントを破棄
```

## 2. コンポーネント設計

### 2.1 新規コンポーネント

#### `ExportLayout`（`src/components/export/export-layout.tsx`）

エクスポート専用のレイアウトコンポーネント。画面には表示せず、html2canvas の対象として使用。

**Props:**
```typescript
type ExportLayoutProps = {
  type: "weekly" | "monthly";
  title: string;       // "2026年2月17日〜2月23日" or "2026年2月のまとめ"
  content: string;     // 通信本文
  photoUrls: string[]; // 写真のURL配列
};
```

**レイアウト構成（幅 800px 固定）:**
```
┌──────────────────────────────────┐
│  🍼 すくすく日記                   │  ← ヘッダー（アプリ名）
│  Weekly Letter / Monthly Essay   │
│  2026年2月17日〜2月23日            │  ← 対象期間
├──────────────────────────────────┤
│                                  │
│  （通信本文）                      │  ← 本文エリア
│                                  │
├──────────────────────────────────┤
│  📷 この週/月の写真               │  ← 写真セクション
│  [写真1] [写真2] [写真3]          │     3列グリッド
│  [写真4]                         │
├──────────────────────────────────┤
│  すくすく日記で作成                │  ← フッター
└──────────────────────────────────┘
```

**スタイル:**
- 白背景
- 本文はアプリと同じ便箋風の罫線付き
- 写真セクションは3列グリッド（角丸）
- フッターは控えめなグレー文字

#### `ShareMenu`（`src/components/export/share-menu.tsx`）

共有ボタンとドロップダウンメニュー。

**Props:**
```typescript
type ShareMenuProps = {
  onExport: (format: "png" | "pdf") => void;
  exporting: boolean;
};
```

**表示:**
- 「共有」ボタン（アイコン付き）
- タップでドロップダウン: 「📷 画像で保存」「📄 PDFで保存」
- エクスポート中はスピナー表示

### 2.2 ユーティリティ

#### `src/lib/export.ts`

エクスポートのコアロジック。

```typescript
// エクスポート用の写真URLを一括取得
export async function fetchPhotoUrls(
  supabase: SupabaseClient,
  dateStart: string,
  dateEnd: string
): Promise<string[]>

// DOM要素をPNGとしてダウンロード
export async function exportAsPng(
  element: HTMLElement,
  filename: string
): Promise<void>

// DOM要素をPDFとしてダウンロード
export async function exportAsPdf(
  element: HTMLElement,
  filename: string
): Promise<void>

// ファイル名を生成
export function buildExportFilename(
  type: "weekly" | "monthly",
  dateLabel: string,
  format: "png" | "pdf"
): string
// → "すくすく日記_2026-02-17_2026-02-23.png"
// → "すくすく日記_2026年2月.pdf"
```

## 3. 既存画面への組み込み

### 週次通信詳細画面（`weekly/[id]/page.tsx`）

- 「再生成する」ボタンの上に `ShareMenu` を配置
- エクスポート時:
  1. 対象期間の写真URLを `fetchPhotoUrls` で取得
  2. `ExportLayout` を一時的にDOMに描画（`position: fixed; left: -9999px`で画面外）
  3. 写真の読み込み完了を待機
  4. `exportAsPng` または `exportAsPdf` を実行
  5. DOM から `ExportLayout` を削除

### 月次まとめ詳細画面（`weekly/monthly/[id]/page.tsx`）

- 同様に `ShareMenu` を配置
- 月の日付範囲を使って写真取得・エクスポート

## 4. ファイル名規則

| 種別 | 形式 | 例 |
|------|------|-----|
| 週次通信 PNG | `すくすく日記_{week_start}_{week_end}.png` | `すくすく日記_2026-02-17_2026-02-23.png` |
| 週次通信 PDF | `すくすく日記_{week_start}_{week_end}.pdf` | `すくすく日記_2026-02-17_2026-02-23.pdf` |
| 月次まとめ PNG | `すくすく日記_{yyyy年M月}.png` | `すくすく日記_2026年2月.png` |
| 月次まとめ PDF | `すくすく日記_{yyyy年M月}.pdf` | `すくすく日記_2026年2月.pdf` |

## 5. 影響範囲

### 新規ファイル
- `src/components/export/export-layout.tsx`
- `src/components/export/share-menu.tsx`
- `src/lib/export.ts`

### 変更ファイル
- `src/app/(main)/weekly/[id]/page.tsx` — ShareMenu 組み込み・エクスポート処理
- `src/app/(main)/weekly/monthly/[id]/page.tsx` — 同上

### 新規依存パッケージ
- `html2canvas`
- `jspdf`
