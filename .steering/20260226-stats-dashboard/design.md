# v2.3 統計ダッシュボード - 設計（v2: 期間タブ対応）

## 1. ナビゲーション変更（実装済み）

省略（変更なし）

## 2. 統計ページ全体設計

### ページレイアウト

```
┌─────────────────────────────────┐
│  📊 統計                        │
├─────────────────────────────────┤
│  [子ども1] [子ども2]  ← 子タブ  │
├─────────────────────────────────┤
│  [週別] [月別] [年別] ← 期間タブ │
│  ◁ 2026年2月23日〜3月1日 ▷     │
├─────────────────────────────────┤
│  ■ 記録数                       │
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
│  │  円グラフ（全期間固定）   │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 期間タブの仕様

| タブ | X軸ラベル | 範囲 | ナビ |
|------|-----------|------|------|
| 週別 | 月, 火, 水, 木, 金, 土, 日 | 1週間（月〜日） | ◁ 前週 / 次週 ▷ |
| 月別 | 1月, 2月, ... 12月 | 1年間 | ◁ 前年 / 次年 ▷ |
| 年別 | 直近5年分の年ラベル | 5年間 | ナビなし |

- 期間タブは記録数・気分推移の両方に連動して適用
- カテゴリ円グラフは全期間固定（タブの影響を受けない）
- 月別グラフはスマホで横スクロール可能（`overflow-x-auto`）

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/lib/stats.ts` | 週別・年別の集計関数を追加。既存関数のリネーム |
| `src/components/stats/period-tabs.tsx` | **新規** 期間タブ + ナビゲーション矢印コンポーネント |
| `src/components/stats/count-chart.tsx` | **リネーム＋改修** 期間タブ対応の棒グラフ |
| `src/components/stats/mood-chart.tsx` | **リネーム＋改修** 期間タブ対応の積み上げ棒グラフ |
| `src/components/stats/category-pie-chart.tsx` | カテゴリ名を日本語表示に修正 |
| `src/app/(main)/stats/page.tsx` | 期間タブ state 管理、集計の切り替え |
| `__tests__/lib/stats.test.ts` | 週別・年別のテスト追加 |

## 3. データ集計ユーティリティ（`src/lib/stats.ts`）

### 新規・変更する型

```typescript
// 汎用の棒グラフデータ（記録数・気分共通で使うX軸ラベル）
export type CountEntry = { label: string; count: number };
export type MoodEntry = {
  label: string;
  moved: number; happy: number; neutral: number; tired: number; sad: number;
};

// 期間タブ種別
export type PeriodType = "weekly" | "monthly" | "yearly";
```

### 集計関数

```typescript
// 週別: 月〜日の7日分を集計
export function calcWeeklyCounts(logs: DailyLog[], weekStart: Date): CountEntry[];
export function calcWeeklyMoods(logs: DailyLog[], weekStart: Date): MoodEntry[];

// 月別: 指定年の1月〜12月を集計
export function calcMonthlyCounts(logs: DailyLog[], year: number): CountEntry[];
export function calcMonthlyMoods(logs: DailyLog[], year: number): MoodEntry[];

// 年別: 直近5年分を集計
export function calcYearlyCounts(logs: DailyLog[]): CountEntry[];
export function calcYearlyMoods(logs: DailyLog[]): MoodEntry[];

// カテゴリ（変更なし、ただしlabel変換をstats.ts内で実施）
export function calcCategoryCounts(logs: DailyLog[]): CategoryCount[];
```

### 週別ロジック
- `weekStart`（月曜日）を受け取り、月〜日の7日間でフィルタ
- X軸ラベル: "月", "火", "水", "木", "金", "土", "日"

### 月別ロジック
- `year`を受け取り、その年の1月〜12月でフィルタ
- X軸ラベル: "1月", "2月", ... "12月"
- ログがない月も0件で表示（12エントリ固定）

### 年別ロジック
- 現在年から過去4年（計5年）でフィルタ
- X軸ラベル: "2022", "2023", ... "2026"
- ログがない年も0件で表示

### カテゴリ修正
- `CATEGORY_OPTIONS` からvalue→labelの変換マップを使い、日本語カテゴリ名で集計

## 4. period-tabs コンポーネント

```tsx
type PeriodTabsProps = {
  period: PeriodType;
  onChangePeriod: (p: PeriodType) => void;
  label: string;         // "2026年2月23日〜3月1日" など
  onPrev?: () => void;   // 年別では非表示
  onNext?: () => void;
  canGoNext?: boolean;    // 未来に進めないよう制限
};
```

## 5. Tooltip背景修正

Rechartsの Tooltip `contentStyle` に明示的に白系背景を指定し、ダークな背景にならないようにする。

## 6. テスト追加

- `calcWeeklyCounts` / `calcWeeklyMoods`: 週の範囲フィルタ、曜日ラベル
- `calcYearlyCounts` / `calcYearlyMoods`: 5年分、ない年は0
- `calcCategoryCounts`: 日本語カテゴリ名で返ること
