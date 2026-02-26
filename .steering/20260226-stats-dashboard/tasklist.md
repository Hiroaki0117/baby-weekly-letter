# v2.3 統計ダッシュボード - タスクリスト

## Phase 1: ナビゲーション再構成

- [x] 1-1. `nav.tsx` の家族(Users)を統計(BarChart3, `/stats`)に変更
- [x] 1-2. `bottom-nav.tsx` を同様に変更
- [x] 1-3. `header.tsx` に家族アイコン（Users, `/family`）を設定アイコンの隣に追加

## Phase 2: 統計集計ユーティリティ

- [x] 2-1. `src/lib/stats.ts` を作成（calcMonthlyCounts, calcMonthlyMoods, calcCategoryCounts）
- [x] 2-2. `__tests__/lib/stats.test.ts` を作成

## Phase 3: Recharts導入 + グラフコンポーネント

- [x] 3-1. `pnpm add recharts` で依存追加
- [x] 3-2. `src/components/stats/monthly-count-chart.tsx` 月別記録数 棒グラフ
- [x] 3-3. `src/components/stats/mood-trend-chart.tsx` 気分推移 積み上げ棒グラフ
- [x] 3-4. `src/components/stats/category-pie-chart.tsx` カテゴリ別割合 円グラフ

## Phase 4: 統計ページ

- [x] 4-1. `src/app/(main)/stats/page.tsx` を作成（データ取得 + 子ども切替 + グラフ配置）

## Phase 5: 品質チェック + デプロイ

- [x] 5-1. `pnpm lint && pnpm type-check && pnpm test`
- [x] 5-2. コミット & プッシュ
