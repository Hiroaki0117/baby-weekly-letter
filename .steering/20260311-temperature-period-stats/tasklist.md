# タスクリスト: 体温記録に時間区分を追加し、統計をグリッド表示に変更

## 1. DB マイグレーション・型定義

- [ ] 1-1. `supabase/migrations/20260311130000_add_temp_period.sql` を作成（カラム追加 + バックフィル + 制約）
- [ ] 1-2. `src/types/database.ts` の temperature_records Row/Insert/Update に `temp_period` を追加
- [ ] 1-3. `src/types/index.ts` に `TempPeriod` 型と `TEMP_PERIOD_OPTIONS` 定数を追加

## 2. 判定ロジック・テスト

- [ ] 2-1. `src/lib/temperature.ts` に `classifyTempPeriod(measuredAt)` 関数を追加
- [ ] 2-2. `src/lib/temperature.ts` の `updateTemperatureRecord` の引数型に `temp_period` を追加
- [ ] 2-3. `__tests__/lib/temperature.test.ts`（新規）に `classifyTempPeriod` のテストケースを追加（境界値含む）

## 3. 登録・更新処理の修正

- [ ] 3-1. `src/components/temperature/quick-temperature-input.tsx` — `handleRecord()` で `temp_period` を付与
- [ ] 3-2. `src/app/(main)/family/page.tsx` — `handleAddTemp()` と `handleUpdateTemp()` で `temp_period` を付与

## 4. 統計チャートの変更

- [ ] 4-1. `src/components/stats/temperature-chart.tsx` を日×時間区分のグリッド表示に変更（色分け・ホバーポップオーバー含む）

## 5. 品質チェック・デプロイ

- [ ] 5-1. `pnpm lint && pnpm type-check && pnpm test` を通す
- [ ] 5-2. commit & push
