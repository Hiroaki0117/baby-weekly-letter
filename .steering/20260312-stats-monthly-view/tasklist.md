# タスクリスト：統計チャートに月別表示を追加

## フェーズ1: ユーティリティ

- [x] 1-1. `src/lib/calendar.ts` — カレンダーグリッド生成関数
- [x] 1-2. `src/lib/temperature.ts` — `calcNormalTemperature` + `percentile` 追加
- [x] 1-3. `__tests__/lib/calendar.test.ts` — カレンダーグリッドテスト
- [x] 1-4. `__tests__/lib/temperature.test.ts` — 平熱算出テスト追加

## フェーズ2: 月別チャート実装

- [x] 2-1. `temperature-chart.tsx` — 週別/月別タブ + カレンダーグリッド + 平熱表示
- [x] 2-2. `sleep-chart.tsx` — 週別/月別タブ + カレンダーグリッド + サマリー
- [x] 2-3. `meal-chart.tsx` — 週別/月別タブ + カレンダーグリッド

## フェーズ3: 品質チェック + デプロイ

- [x] 3-1. `pnpm lint` / `pnpm type-check` / `pnpm test`
- [x] 3-2. commit + push
