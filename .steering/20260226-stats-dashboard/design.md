# v2.3 統計ダッシュボード - 設計

## 1. ナビゲーション変更

### 変更するファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/components/layout/nav.tsx` | `Users`(家族) → `BarChart3`(統計)、href `/family` → `/stats` |
| `src/components/layout/bottom-nav.tsx` | 同上 |
| `src/components/layout/header.tsx` | 設定アイコンの隣に家族アイコン（Users）を追加 |
| `src/app/(main)/family/page.tsx` | モバイル版の設定ボタン横に「家族」ヘッダーリンクの調整（ナビから外れるため影響なし、既にページとして独立） |

### ナビ項目（PC・スマホ共通）

```
今日(Home) | カレンダー(Calendar) | 記録(BookOpen) | 写真(ImageIcon) | 統計(BarChart3)
```

### ヘッダーアイコン（PC版・設定の隣）

```
[家族アイコン] [設定アイコン] ログアウト
```

## 2. 統計ページ設計

### 新規ファイル

| ファイル | 役割 |
|---------|------|
| `src/app/(main)/stats/page.tsx` | 統計ページ本体。データ取得 + 子ども切替 + グラフ3つ配置 |
| `src/lib/stats.ts` | 統計データ集計ユーティリティ |
| `src/components/stats/monthly-count-chart.tsx` | 月別記録数 棒グラフ |
| `src/components/stats/mood-trend-chart.tsx` | 気分推移 積み上げ棒グラフ |
| `src/components/stats/category-pie-chart.tsx` | カテゴリ別割合 円グラフ |

### 依存ライブラリ追加

```bash
pnpm add recharts
```

## 3. データ集計ユーティリティ（`src/lib/stats.ts`）

```typescript
import type { DailyLog, Mood } from "@/types";

// 月別記録数
export type MonthlyCount = {
  month: string;   // "2025/01"
  count: number;
};

// 月別気分内訳
export type MonthlyMood = {
  month: string;
  moved: number;
  happy: number;
  neutral: number;
  tired: number;
  sad: number;
};

// カテゴリ別件数
export type CategoryCount = {
  category: string;
  count: number;
};

export function calcMonthlyCounts(logs: DailyLog[]): MonthlyCount[];
export function calcMonthlyMoods(logs: DailyLog[]): MonthlyMood[];
export function calcCategoryCounts(logs: DailyLog[]): CategoryCount[];
```

### 集計ロジック

- **月別記録数**: `log_date` から `YYYY/MM` を抽出し、月ごとにカウント。昇順ソート。
- **月別気分**: 月ごとに5つの気分をそれぞれカウント。昇順ソート。
- **カテゴリ別**: `categories` 配列を展開し、カテゴリごとにカウント。件数降順ソート。

## 4. グラフコンポーネント設計

### 4.1 月別記録数（`monthly-count-chart.tsx`）

- Recharts の `BarChart` + `Bar` を使用
- X軸: 月ラベル、Y軸: 件数
- バーの色: `hsl(var(--primary))`
- レスポンシブ: `ResponsiveContainer` で幅100%

### 4.2 気分の推移（`mood-trend-chart.tsx`）

- Recharts の `BarChart` + `Bar` を積み上げ（`stackId="mood"`）
- 5色の気分カラー:
  - moved(🥰): `#f472b6`（ピンク）
  - happy(🙂): `#fbbf24`（イエロー）
  - neutral(😐): `#94a3b8`（グレー）
  - tired(😴): `#818cf8`（パープル）
  - sad(😭): `#60a5fa`（ブルー）
- 凡例（Legend）を下部に表示

### 4.3 カテゴリ別割合（`category-pie-chart.tsx`）

- Recharts の `PieChart` + `Pie` を使用
- ラベル: カテゴリ名 + 件数
- カラー: Tailwind のカラーパレットから8色を割り当て

## 5. ページレイアウト（`stats/page.tsx`）

```
┌─────────────────────────────────┐
│  📊 統計                        │
├─────────────────────────────────┤
│  [子ども1] [子ども2]  ← タブ    │
│  （1人の場合は非表示）           │
├─────────────────────────────────┤
│  ■ 月別の記録数                 │
│  ┌─────────────────────────┐    │
│  │  棒グラフ                │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  ■ 気分の推移                   │
│  ┌─────────────────────────┐    │
│  │  積み上げ棒グラフ        │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  ■ カテゴリ別の記録             │
│  ┌─────────────────────────┐    │
│  │  円グラフ                │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### データ取得

- `useEffect` で `daily_logs` を全件取得（家族ID + 選択中の子供ID でフィルタ）
- クライアントサイドで `stats.ts` の集計関数を使って変換
- 子ども切り替え時にデータを再フィルタ

### 空状態

- ログが0件の場合: 「まだ記録がありません。記録を追加すると統計が表示されます。」

## 6. テスト

- `__tests__/lib/stats.test.ts` に集計ユーティリティのテストを追加
  - `calcMonthlyCounts`: 月ごとの集計、空配列、ソート順
  - `calcMonthlyMoods`: 気分ごとの集計、複数月
  - `calcCategoryCounts`: カテゴリ展開、降順ソート、空カテゴリ
