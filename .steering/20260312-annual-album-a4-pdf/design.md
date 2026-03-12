# 設計: 年次アルバムのA4印刷対応PDF出力

## 方針

ブラウザ上のアルバム表示（`AnnualAlbumView`）はそのまま維持する。PDF出力時のみ、A4サイズ用の非表示レイアウトをページごとにレンダリングし、各ページを画像化してPDFに結合する。

## PDF出力の仕組み

### 現状

```
DOM全体 → 1枚のPNG → 動的サイズのPDF（1ページ）
```

### 改善後

```
PDF用レイアウト（6ページ分の非表示DOM）
  → ページ1のDOM → PNG → PDF 1ページ目
  → ページ2のDOM → PNG → PDF 2ページ目
  → ...
  → ページ6のDOM → PNG → PDF 6ページ目
→ A4サイズ（210mm × 297mm）の6ページPDF
```

## コード変更

### 1. `src/lib/export.ts` — `exportAsA4Pdf` 関数を追加

```typescript
export async function exportAsA4Pdf(
  pages: HTMLElement[],
  filename: string,
): Promise<void>
```

- 引数: A4ページに対応するDOM要素の配列
- 各要素を `toPng()` で画像化
- A4サイズ（210×297mm）のjsPDFを作成
- 各画像を1ページずつ `addImage` で追加
- 2ページ目以降は `addPage()` してから追加

### 2. `src/components/annual/annual-pdf-layout.tsx` — PDF用レイアウトコンポーネント（新規）

PDF出力専用の非表示レイアウト。A4比率（210:297）に合わせた6つのページコンテナを描画する。

```typescript
type AnnualPdfLayoutProps = {
  content: AnnualReportContent;
  photoUrls: Map<number, string>;
  pagesRef: React.MutableRefObject<HTMLDivElement[]>;
};
```

- `pagesRef` で各ページのDOM要素を親コンポーネントに公開
- 各ページは固定幅（例: 794px = A4 210mm × 96dpi相当）＋固定高さ（1123px = A4 297mm相当）
- `overflow-hidden` でページ外にはみ出す内容をクリップ
- 親要素に `position: absolute; left: -9999px` で非表示にする

#### ページ1: 表紙

- タイトル（coverTitle）
- 年齢（childAge）
- 写真コラージュ: `photoUrls` から最大6枚を2×3または3×2のグリッドで配置
  - 5枚以下の場合はグリッドサイズを調整（4枚→2×2、2-3枚→1行、1枚→大きく中央配置）
  - 0枚の場合はコラージュなし、装飾的なテキストレイアウト

#### ページ2〜4: 月別ハイライト

- 1ページに4ヶ月分を均等に4分割
- ページ2: 4月〜7月、ページ3: 8月〜11月、ページ4: 12月〜3月
- 各月は写真の有無に関わらず同じ高さのスペースを使用
- 写真あり: 写真（左）+ テキスト（右）
- 写真なし: テキストのみ（同じスペース）

#### ページ5: マイルストーン + 成長記録

- マイルストーンは最大15件（`content.milestones.slice(0, 15)`）
- 15件を超える場合は古い順に省略
- 成長記録: 身長・体重の変化（既存の `GrowthSummarySection` と同等）

#### ページ6: 締めのメッセージ

- 「1年の振り返り」見出し
- closingMessage を大きめの文字で表示

### 3. `src/components/annual/annual-album-view.tsx` — 改修

- `AnnualPdfLayout` を非表示で描画
- `handleExportPdf` を `exportAsA4Pdf` に切り替え
- `pagesRef` から各ページのDOM要素を取得して `exportAsA4Pdf` に渡す
- 既存の `exportRef` と `exportAsPdf` の使用を削除

### 4. `src/lib/annual-report/prompt.ts` — closingMessage の文字数制限

closingMessage のルールに「300文字以内」の制約を追加:

```
### closingMessage のルール
- 1年間の成長を振り返り、感動的なメッセージを3〜5文、300文字以内で書く
```

## PDF用ページのサイズ設計

A4比率（210:297）を維持した固定サイズのDOMコンテナを使用:

- 幅: 794px（210mm × 96dpi / 25.4）
- 高さ: 1123px（297mm × 96dpi / 25.4）
- padding: 各辺 40px（余白を確保して印刷時に切れないように）

`toPng` の `pixelRatio: 2` で高解像度化し、PDFに210×297mmで埋め込む。

## 影響範囲

- `src/lib/export.ts` — 関数追加のみ（既存関数は変更なし）
- `src/components/annual/annual-pdf-layout.tsx` — 新規ファイル
- `src/components/annual/annual-album-view.tsx` — PDF出力部分のみ変更
- `src/lib/annual-report/prompt.ts` — closingMessage の文字数制限追記
- ブラウザ上のアルバム表示には影響なし
